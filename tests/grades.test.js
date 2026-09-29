const test = require("node:test");
const assert = require("node:assert");
const { JSDOM } = require("jsdom");
const {
  findFapGradeTable,
  parseFapGradeTable,
  calculateCurrentScore,
  calculateRequiredExamScore
} = require("../lib/grades.js");
const {
  extractCourseCodeAndName,
  getGradePageCourses,
  extractStudentGradeFromPage,
  getGradePageControls,
  fetchCourseGradeFromPage
} = require("../content.js");

const REAL_FAP_HTML = `
<table summary="Report">
  <caption>... then see report - <a class="label label-success" target="_blank" href="#">Recalculate</a></caption>
  <thead>
    <tr><th>Grade category</th><th>Grade item</th><th>Weight</th><th>Value</th><th>Comment</th></tr>
  </thead>
  <tbody>
    <tr style="color: rgb(51, 122, 183); cursor: pointer;">
      <td rowspan="2">Final exam PE</td><td>Final exam PE</td><td>100.0 %</td><td>7</td><td></td>
    </tr>
    <tr><td>Total</td><td>100.0 %</td><td>7</td><td></td></tr>
    <tr>
      <td rowspan="2">Final exam PE Resit</td><td>Final exam PE Resit</td><td>100.0 %</td><td></td><td></td>
    </tr>
    <tr><td>Total</td><td>100.0 %</td><td></td><td></td></tr>
    <tr><td></td><td>Bonus</td><td></td><td>1</td><td></td></tr>
  </tbody>
  <tfoot>
    <tr><td rowspan="2">Course total</td><td>Average</td><td colspan="3">8.0</td></tr>
    <tr><td>Status</td><td colspan="3"><font color="Green">Passed</font></td></tr>
  </tfoot>
</table>
`;

const INCOMPLETE_COURSE_HTML = `
<table summary="Report">
  <thead>
    <tr><th>Grade category</th><th>Grade item</th><th>Weight</th><th>Value</th><th>Comment</th></tr>
  </thead>
  <tbody>
    <tr><td rowspan="3">Quiz</td><td>Quiz 1</td><td>5.0 %</td><td>8.0</td><td></td></tr>
    <tr><td>Quiz 2</td><td>5.0 %</td><td>9.0</td><td></td></tr>
    <tr><td>Total</td><td>10.0 %</td><td>8.5</td><td></td></tr>
    <tr><td rowspan="2">Assignment</td><td>Assignment 1</td><td>20.0 %</td><td>7.5</td><td></td></tr>
    <tr><td>Total</td><td>20.0 %</td><td>7.5</td><td></td></tr>
    <tr><td rowspan="2">Progress Test</td><td>Progress Test</td><td>20.0 %</td><td>8.0</td><td></td></tr>
    <tr><td>Total</td><td>20.0 %</td><td>8.0</td><td></td></tr>
    <tr><td rowspan="2">Final Exam</td><td>Final Exam</td><td>50.0 %</td><td></td><td></td></tr>
    <tr><td>Total</td><td>50.0 %</td><td></td><td></td></tr>
  </tbody>
  <tfoot>
    <tr><td rowspan="2">Course total</td><td>Average</td><td colspan="3"></td></tr>
    <tr><td>Status</td><td colspan="3"></td></tr>
  </tfoot>
</table>
`;

test("parseFapGradeTable parses real FAP HTML with rowspan and totals", () => {
  const dom = new JSDOM(REAL_FAP_HTML);
  const table = dom.window.document.querySelector('table[summary="Report"]');
  const result = parseFapGradeTable(table);

  assert.strictEqual(result.average, 8.0);
  assert.strictEqual(result.status, "Passed");
  assert.strictEqual(result.bonus, 1.0);
  assert.strictEqual(result.categories.length, 1); // Resit excluded
  assert.strictEqual(result.categories[0].category, "Final exam PE");
  assert.strictEqual(result.categories[0].weight, 100.0);
  assert.strictEqual(result.categories[0].value, 7.0);
});

test("calculateCurrentScore calculates completed weighted score correctly", () => {
  const dom = new JSDOM(INCOMPLETE_COURSE_HTML);
  const table = dom.window.document.querySelector('table[summary="Report"]');
  const result = parseFapGradeTable(table);

  const scoreInfo = calculateCurrentScore(result.categories, result.bonus);
  // Quiz: 8.5 * 10% = 0.85
  // Assignment: 7.5 * 20% = 1.50
  // Progress Test: 8.0 * 20% = 1.60
  // Total current = 0.85 + 1.50 + 1.60 = 3.95
  // Completed weight = 50%, Remaining weight = 50%
  assert.strictEqual(scoreInfo.completedWeight, 50);
  assert.strictEqual(scoreInfo.remainingWeight, 50);
  assert.strictEqual(Math.round(scoreInfo.currentWeightedScore * 100) / 100, 3.95);
});

test("calculateRequiredExamScore predicts minimum FE score to pass (5.0)", () => {
  const dom = new JSDOM(INCOMPLETE_COURSE_HTML);
  const table = dom.window.document.querySelector('table[summary="Report"]');
  const parsed = parseFapGradeTable(table);

  const pred = calculateRequiredExamScore(parsed.categories, parsed.bonus, 5.0, 4.0);
  // Current score = 3.95, Remaining weight = 50%
  // Need: (5.0 - 3.95) / 0.50 = 2.1
  // Since 2.1 <= 4.0 and 3.95 + 4.0*0.50 = 5.95 >= 5.0:
  // student passes simply by hitting exam floor 4.0 -> pass_guaranteed!
  assert.strictEqual(pred.status, "pass_guaranteed");
  assert.strictEqual(Math.round(pred.requiredScore * 10) / 10, 2.1);
  assert.strictEqual(pred.minRequired, 4.0);

  // Target = 7.0 (achievable case)
  // Need: (7.0 - 3.95) / 0.50 = 3.05 / 0.50 = 6.1
  const pred7 = calculateRequiredExamScore(parsed.categories, parsed.bonus, 7.0, 4.0);
  assert.strictEqual(pred7.status, "achievable");
  assert.strictEqual(Math.round(pred7.requiredScore * 10) / 10, 6.1);
  assert.strictEqual(pred7.minRequired, 6.1);
});

test("calculateRequiredExamScore detects pass_guaranteed and impossible cases", () => {
  const highCategories = [
    { category: "Lab", weight: 90, value: 9.0, isFinal: false },
    { category: "Final Exam", weight: 10, value: null, isFinal: true }
  ];
  // 9.0 * 0.9 = 8.1 >= 5.0 -> already guaranteed pass
  const guaranteed = calculateRequiredExamScore(highCategories, 0, 5.0, 4.0);
  assert.strictEqual(guaranteed.status, "pass_guaranteed");

  // Impossible case: Current score 1.0, Remaining weight 20%
  // Max possible = 1.0 + 10.0 * 0.20 = 3.0 < 5.0
  const lowCategories = [
    { category: "Lab", weight: 80, value: 1.25, isFinal: false },
    { category: "Final Exam", weight: 20, value: null, isFinal: true }
  ];
  const impossible = calculateRequiredExamScore(lowCategories, 0, 5.0, 4.0);
  assert.strictEqual(impossible.status, "impossible");
  assert.ok(impossible.requiredScore > 10.0);
});

test("findFapGradeTable finds summary=Report and fallback tables", () => {
  const dom1 = new JSDOM(REAL_FAP_HTML);
  assert.ok(findFapGradeTable(dom1.window.document));

  const dom2 = new JSDOM(`
    <table>
      <thead><tr><th>Grade category</th><th>Weight</th><th>Value</th></tr></thead>
      <tbody><tr><td>Quiz</td><td>10%</td><td>8</td></tr></tbody>
    </table>
  `);
  assert.ok(findFapGradeTable(dom2.window.document));
});

test("extractCourseCodeAndName extracts code and clean name correctly", () => {
  assert.deepStrictEqual(
    extractCourseCodeAndName("Experiential Entrepreneurship (ENT301m) (from 13/05/2026 - 22/07/2026)", "100609"),
    { courseCode: "ENT301M", courseName: "Experiential Entrepreneurship" }
  );

  assert.deepStrictEqual(
    extractCourseCodeAndName("Multiplatform Mobile App (PRN211)", "100610"),
    { courseCode: "PRN211", courseName: "Multiplatform Mobile App" }
  );

  assert.deepStrictEqual(
    extractCourseCodeAndName("Project management (PMG202c)", "100611"),
    { courseCode: "PMG202C", courseName: "Project management" }
  );

  assert.deepStrictEqual(
    extractCourseCodeAndName("PRJ301 - Server-Side development", "100612"),
    { courseCode: "PRJ301", courseName: "Server-Side development" }
  );

  assert.deepStrictEqual(
    extractCourseCodeAndName("Experiential Entrepreneurship", "100609"),
    { courseCode: "EE_100609", courseName: "Experiential Entrepreneurship" }
  );

  assert.deepStrictEqual(
    extractCourseCodeAndName("Experiential Entrepreneurship 1 (IS1905-EIS, EXE101) (from 13/05/2026 - 22/07/2026)", "100609"),
    { courseCode: "EXE101", courseName: "Experiential Entrepreneurship 1" }
  );

  assert.deepStrictEqual(
    extractCourseCodeAndName("Experiential Entrepreneurship 1 (IS1905-EIS, (EXE101)", "100609"),
    { courseCode: "EXE101", courseName: "Experiential Entrepreneurship 1" }
  );

  assert.deepStrictEqual(
    extractCourseCodeAndName("SW Architecture and Design (SE1801, SWD392)", "100613"),
    { courseCode: "SWD392", courseName: "SW Architecture and Design" }
  );
});

test("getGradePageCourses and extractStudentGradeFromPage parse real FAP page layout", () => {
  const REAL_PAGE_HTML = `
    <html>
      <body>
        <table>
          <thead><tr><th>TERM</th><th>COURSE</th></tr></thead>
          <tbody>
            <tr>
              <td><a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026">Summer2026</a></td>
              <td>
                <a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100609">Experiential Entrepreneurship (ENT301m) (from 13/05/2026 - 22/07/2026)</a><br/>
                <a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100610">Multiplatform Mobile App (PRN211) (from 13/05/2026 - 22/07/2026)</a><br/>
                <a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100611">Project management (PMG202c)</a>
              </td>
            </tr>
          </tbody>
        </table>
        <table summary="Report">
          <thead>
            <tr><th>Grade category</th><th>Grade item</th><th>Weight</th><th>Value</th><th>Comment</th></tr>
          </thead>
          <tbody>
            <tr><td rowspan="2">Group Assignment 1</td><td>Group Assignment 1</td><td>10.0 %</td><td>8</td><td></td></tr>
            <tr><td>Total</td><td>10.0 %</td><td>8</td><td></td></tr>
            <tr><td rowspan="2">Constructivism Presentations</td><td>Constructivism Presentations</td><td>15.0 %</td><td>8.5</td><td></td></tr>
            <tr><td>Total</td><td>15.0 %</td><td>8.5</td><td></td></tr>
            <tr><td rowspan="2">Presentation</td><td>Presentation</td><td>40.0 %</td><td>7.6</td><td></td></tr>
            <tr><td>Total</td><td>40.0 %</td><td>7.6</td><td></td></tr>
          </tbody>
          <tfoot>
            <tr><td rowspan="2">COURSE TOTAL</td><td>AVERAGE</td><td colspan="3">7.8</td></tr>
            <tr><td>STATUS</td><td colspan="3"><font color="Green">PASSED</font></td></tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;

  const dom = new JSDOM(REAL_PAGE_HTML, {
    url: "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100609"
  });

  const controls = getGradePageControls(dom.window.document);
  assert.strictEqual(controls.ok, true);
  assert.strictEqual(controls.courses.length, 3);
  assert.strictEqual(controls.courses[0].courseCode, "ENT301M");
  assert.strictEqual(controls.courses[1].courseCode, "PRN211");
  assert.strictEqual(controls.courses[2].courseCode, "PMG202C");

  // Extract the current course grade
  const grade = extractStudentGradeFromPage(dom.window.document);
  assert.ok(grade, "extracted grade");
  assert.strictEqual(grade.courseCode, "ENT301M");
  assert.strictEqual(grade.average, 7.8);
  assert.strictEqual(grade.status, "Passed");
  assert.strictEqual(grade.term, "Summer2026");
});

test("parse real screenshot FAP layout with 4 columns and bold active course", () => {
  const SCREENSHOT_PAGE_HTML = `
    <!DOCTYPE html>
    <html>
      <body>
        <div id="ctl00_mainContent_divContent">
          <h2>Grade report for HE190183 (Nguyen Van A)</h2>
          <table>
            <thead><tr><th>TERM</th><th>COURSE</th></tr></thead>
            <tbody>
              <tr><td>Fall2023</td><td><b>Experiential Entrepreneurship (from 13/05/2026 - 22/07/2026)</b></td></tr>
              <tr><td>Spring2024</td><td><a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100610">Multiplatform Mobile App (PRN211)</a></td></tr>
              <tr><td>Summer2024</td><td><a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100611">Project management (PMG201c)</a></td></tr>
              <tr><td>Fall2024</td><td><a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100612">Server-Side development with VBNET (PRN292)</a></td></tr>
              <tr><td>Spring2025</td><td><a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100613">SW Architecture and Design (SWD392)</a></td></tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr><th>GRADE ITEM</th><th>WEIGHT</th><th>VALUE</th><th>COMMENT</th></tr>
            </thead>
            <tbody>
              <tr><td>Group Assignment 1 (Checkpoint 1)</td><td>10.0 %</td><td>8</td><td></td></tr>
              <tr><td>Total</td><td>10.0 %</td><td>8</td><td></td></tr>
              <tr><td>Constructivism Presentations</td><td>15.0 %</td><td>8.5</td><td></td></tr>
              <tr><td>Total</td><td>15.0 %</td><td>8.5</td><td></td></tr>
              <tr><td>Group Assignment 3 (Checkpoint 3)</td><td>15.0 %</td><td>7.5</td><td></td></tr>
              <tr><td>Total</td><td>15.0 %</td><td>7.5</td><td></td></tr>
              <tr><td>Group Assignment 2 (Checkpoint 2)</td><td>20.0 %</td><td>7.6</td><td></td></tr>
              <tr><td>Total</td><td>20.0 %</td><td>7.6</td><td></td></tr>
              <tr><td>Presentation (Checkpoint 4)</td><td>40.0 %</td><td>7.6</td><td></td></tr>
              <tr><td>Total</td><td>40.0 %</td><td>7.6</td><td></td></tr>
            </tbody>
            <tfoot>
              <tr><td>COURSE TOTAL</td><td>AVERAGE</td><td colspan="2">7.8</td></tr>
              <tr><td>STATUS</td><td colspan="2"><font color="Green">PASSED</font></td></tr>
            </tfoot>
          </table>
        </div>
      </body>
    </html>
  `;

  const dom = new JSDOM(SCREENSHOT_PAGE_HTML, {
    url: "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100609"
  });

  const controls = getGradePageControls(dom.window.document);
  assert.strictEqual(controls.ok, true);
  assert.strictEqual(controls.courses.length, 5);
  assert.strictEqual(controls.courses[0].isActive, true);
  assert.strictEqual(controls.courses[0].id, "100609");
  assert.strictEqual(controls.courses[0].courseCode, "EE_100609");
  assert.strictEqual(controls.courses[1].courseCode, "PRN211");
  assert.strictEqual(controls.courses[2].courseCode, "PMG201C");
  assert.strictEqual(controls.courses[3].courseCode, "PRN292");
  assert.strictEqual(controls.courses[4].courseCode, "SWD392");

  const grade = extractStudentGradeFromPage(dom.window.document);
  assert.ok(grade, "grade extracted");
  assert.strictEqual(grade.courseCode, "EE_100609");
  assert.strictEqual(grade.categories.length, 5);
  assert.strictEqual(grade.categories[0].category, "Group Assignment 1 (Checkpoint 1)");
  assert.strictEqual(grade.categories[0].weight, 10);
  assert.strictEqual(grade.categories[0].value, 8);
  assert.strictEqual(grade.categories[4].category, "Presentation (Checkpoint 4)");
  assert.strictEqual(grade.categories[4].weight, 40);
  assert.strictEqual(grade.categories[4].value, 7.6);
  assert.strictEqual(grade.average, 7.8);
  assert.strictEqual(grade.status, "Passed");
});

test("fetchCourseGradeFromPage fetches and parses course HTML in tab context", async () => {
  const dom = new JSDOM();
  global.DOMParser = dom.window.DOMParser;

  const OTHER_COURSE_HTML = `
    <table>
      <thead><tr><th>GRADE ITEM</th><th>WEIGHT</th><th>VALUE</th><th>COMMENT</th></tr></thead>
      <tbody>
        <tr><td>Assignment 1</td><td>20.0 %</td><td>8.5</td><td></td></tr>
        <tr><td>Total</td><td>20.0 %</td><td>8.5</td><td></td></tr>
        <tr><td>Final Exam PE</td><td>80.0 %</td><td>9.0</td><td></td></tr>
        <tr><td>Total</td><td>80.0 %</td><td>9.0</td><td></td></tr>
      </tbody>
      <tfoot>
        <tr><td>AVERAGE</td><td>8.9</td></tr>
        <tr><td>STATUS</td><td>PASSED</td></tr>
      </tfoot>
    </table>
  `;

  const originalFetch = global.fetch;
  try {
    global.fetch = async (url) => {
      assert.ok(url.includes("course=100610"));
      return {
        ok: true,
        text: async () => OTHER_COURSE_HTML
      };
    };

    const res = await fetchCourseGradeFromPage("https://fap.fpt.edu.vn/Grade/StudentGrade.aspx?course=100610");
    assert.ok(res, "parsed course grade");
    assert.strictEqual(res.categories.length, 2);
    assert.strictEqual(res.categories[0].category, "Assignment 1");
    assert.strictEqual(res.categories[0].value, 8.5);
    assert.strictEqual(res.categories[1].category, "Final Exam PE");
    assert.strictEqual(res.categories[1].value, 9.0);
    assert.strictEqual(res.average, 8.9);
    assert.strictEqual(res.status, "Passed");
  } finally {
    global.fetch = originalFetch;
  }
});

test("active course code extraction works and never picks up grade table items (reproduction)", () => {
  const NESTED_FAP_HTML = `
    <!DOCTYPE html>
    <html>
      <body>
        <table>
          <tr>
            <td>
              <table>
                <tr><td>TERM</td></tr>
                <tr><td><a href="?term=Fall2023">Fall2023</a></td></tr>
                <tr><td><b>Summer2026</b></td></tr>
              </table>
            </td>
            <td>
              <table>
                <tr><td>COURSE</td></tr>
                <tr><td><b>Experiential Entrepreneurship (from 13/05/2026 - 22/07/2026)</b></td></tr>
                <tr><td><a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100610">Multiplatform Mobile App (PRN211)</a></td></tr>
                <tr><td><a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100611">Project management (PMG201c)</a></td></tr>
              </table>
            </td>
          </tr>
        </table>

        <table summary="Report">
          <thead>
            <tr><th>Grade category</th><th>Grade item</th><th>Weight</th><th>Value</th><th>Comment</th></tr>
          </thead>
          <tbody>
            <tr><td rowspan="2">Group Assignment 1 (Checkpoint 1)</td><td>Group Assignment 1 (Checkpoint 1)</td><td>10.0 %</td><td>8</td><td></td></tr>
            <tr><td>Total</td><td>10.0 %</td><td>8</td><td></td></tr>
            <tr><td rowspan="2">Constructivism Presentations</td><td>Constructivism Presentations</td><td>15.0 %</td><td>8.5</td><td></td></tr>
            <tr><td>Total</td><td>15.0 %</td><td>8.5</td><td></td></tr>
          </tbody>
          <tfoot>
            <tr><td rowspan="2">COURSE TOTAL</td><td>AVERAGE</td><td colspan="3">7.8</td></tr>
            <tr><td>STATUS</td><td colspan="3"><font color="Green">PASSED</font></td></tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;

  const dom = new JSDOM(NESTED_FAP_HTML, {
    url: "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100609"
  });

  const controls = getGradePageControls(dom.window.document);
  assert.strictEqual(controls.ok, true);
  assert.strictEqual(controls.courses.length, 3);
  // The active course MUST be Experiential Entrepreneurship (EE_100609), NEVER GA1(1_100609)
  assert.strictEqual(controls.courses[0].id, "100609");
  assert.strictEqual(controls.courses[0].courseCode, "EE_100609");
  assert.strictEqual(controls.courses[0].courseName, "Experiential Entrepreneurship");
  assert.strictEqual(controls.courses[0].isActive, true);

  const grade = extractStudentGradeFromPage(dom.window.document);
  assert.ok(grade, "grade extracted");
  assert.strictEqual(grade.courseCode, "EE_100609");
  assert.strictEqual(grade.courseName, "Experiential Entrepreneurship");
  assert.notStrictEqual(grade.courseCode, "GA1(1_100609");
  assert.notStrictEqual(grade.courseName, "Group Assignment 1 (Checkpoint 1)");
});

test("active course code extraction works on single-row 2-column FAP layout", () => {
  const SINGLE_ROW_FAP_HTML = `
    <!DOCTYPE html>
    <html>
      <body>
        <table>
          <thead><tr><th>TERM</th><th>COURSE</th></tr></thead>
          <tbody>
            <tr>
              <td>
                <a href="?term=Fall2023">Fall2023</a><br/>
                <b>Summer2026</b>
              </td>
              <td>
                <b>Experiential Entrepreneurship (from 13/05/2026 - 22/07/2026)</b><br/>
                <a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100610">Multiplatform Mobile App (PRN211)</a><br/>
                <a href="StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100611">Project management (PMG201c)</a>
              </td>
            </tr>
          </tbody>
        </table>

        <table summary="Report">
          <thead>
            <tr><th>Grade category</th><th>Grade item</th><th>Weight</th><th>Value</th><th>Comment</th></tr>
          </thead>
          <tbody>
            <tr><td rowspan="2">Group Assignment 1 (Checkpoint 1)</td><td>Group Assignment 1 (Checkpoint 1)</td><td>10.0 %</td><td>8</td><td></td></tr>
            <tr><td>Total</td><td>10.0 %</td><td>8</td><td></td></tr>
          </tbody>
          <tfoot>
            <tr><td rowspan="2">COURSE TOTAL</td><td>AVERAGE</td><td colspan="3">7.8</td></tr>
            <tr><td>STATUS</td><td colspan="3"><font color="Green">PASSED</font></td></tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;

  const dom = new JSDOM(SINGLE_ROW_FAP_HTML, {
    url: "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx?rollNumber=HE190183&term=Summer2026&course=100609"
  });

  const controls = getGradePageControls(dom.window.document);
  assert.strictEqual(controls.ok, true);
  assert.strictEqual(controls.courses.length, 3);
  assert.strictEqual(controls.courses[0].id, "100609");
  assert.strictEqual(controls.courses[0].courseCode, "EE_100609");
  assert.strictEqual(controls.courses[0].courseName, "Experiential Entrepreneurship");
  assert.strictEqual(controls.courses[0].isActive, true);

  const grade = extractStudentGradeFromPage(dom.window.document);
  assert.ok(grade, "grade extracted");
  assert.strictEqual(grade.courseCode, "EE_100609");
  assert.strictEqual(grade.courseName, "Experiential Entrepreneurship");
});

test("parseFapGradeTable and extractStudentGradeFromPage parse modern FAP UI (v4.0.0)", () => {
  const MODERN_FAP_GRADE_HTML = `
    <!DOCTYPE html>
    <html>
      <body>
        <select id="grade-report-course" class="form-select academic-report-course-select">
          <option value="01a07c76-e546-76e2-8e02-b620de7d1b65" data-report-term-id="01a07c76-b178-78de-b4c0-96dcec4717e4" data-fallback-href="/Report/Grade?termId=01a07c76-b178-78de-b4c0-96dcec4717e4&amp;courseId=01a07c76-e546-76e2-8e02-b620de7d1b65" selected="selected">
              On-The-Job Training (OJT202) (OJT202_SP26)
          </option>
          <option value="01a07c76-e3b9-7c87-a7ce-75ee94bede0f" data-report-term-id="01a07c76-b178-78de-b4c0-96dcec4717e4" data-fallback-href="/Report/Grade?termId=01a07c76-b178-78de-b4c0-96dcec4717e4&amp;courseId=01a07c76-e3b9-7c87-a7ce-75ee94bede0f">
              Research Methods &amp; Academic Writing Skills (ENW493c) (ENW493C.9)
          </option>
        </select>

        <div class="card fap-result-card">
            <div class="card-header">
                <h5 class="fap-result-card__title">
                    On-The-Job Training
                        <span class="fap-result-card__code">OJT202</span>
                </h5>
                <p class="fap-result-card__meta">
                    <span><i class="ri-book-open-line" aria-hidden="true"></i> OJT202_SP26</span>
                    <span><i class="ri-calendar-line" aria-hidden="true"></i> Spring2026</span>
                </p>
            </div>
            <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-vcenter mb-0 student-mark-sheet">
                            <thead>
                                <tr>
                                    <th scope="col">Nhóm điểm</th>
                                    <th scope="col">Tên cột điểm</th>
                                    <th scope="col" class="student-mark-col-score">Trọng số (%)</th>
                                    <th scope="col" class="student-mark-col-score">Điểm cuối cùng</th>
                                    <th scope="col">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                        <tr>
                                                <td rowspan="2" class="sheet-group-cell">Kiến thức và kỹ năng chuyên môn</td>
                                            <td>Kiến thức và kỹ năng chuyên môn</td>
                                            <td class="text-center mark-score">40</td>
                                            <td class="text-center mark-score">7,0</td>
                                            <td>-</td>
                                        </tr>
                                    <tr class="sheet-row-total">
                                        <td class="text-center">Tổng</td>
                                        <td class="text-center mark-score">40%</td>
                                        <td class="text-center mark-score">7,0</td>
                                        <td></td>
                                    </tr>
                                        <tr>
                                                <td rowspan="2" class="sheet-group-cell">Kỹ năng mềm</td>
                                            <td>Kỹ năng mềm</td>
                                            <td class="text-center mark-score">30</td>
                                            <td class="text-center mark-score">6,0</td>
                                            <td>-</td>
                                        </tr>
                                    <tr class="sheet-row-total">
                                        <td class="text-center">Tổng</td>
                                        <td class="text-center mark-score">30%</td>
                                        <td class="text-center mark-score">6,0</td>
                                        <td></td>
                                    </tr>
                                        <tr>
                                                <td rowspan="2" class="sheet-group-cell">Thái độ</td>
                                            <td>Thái độ</td>
                                            <td class="text-center mark-score">30</td>
                                            <td class="text-center mark-score">8,0</td>
                                            <td>-</td>
                                        </tr>
                                    <tr class="sheet-row-total">
                                        <td class="text-center">Tổng</td>
                                        <td class="text-center mark-score">30%</td>
                                        <td class="text-center mark-score">8,0</td>
                                        <td></td>
                                    </tr>
                                <tr class="sheet-grand-total">
                                    <td></td>
                                    <td class="text-end">Nộp muộn (%)</td>
                                    <td class="text-center" colspan="2">0%</td>
                                    <td></td>
                                </tr>
                                <tr class="sheet-grand-total">
                                    <td></td>
                                    <td class="text-end">Tổng môn</td>
                                    <td class="text-center">Điểm trung bình</td>
                                    <td class="text-center">
                                        <span class="grade-average grade-status--passed">7,0</span>
                                    </td>
                                    <td>
                                            <span class="grade-status grade-status--passed">
                                                <i class="ri-checkbox-circle-fill" aria-hidden="true"></i>
                                                Trạng thái: Passed
                                            </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>
      </body>
    </html>
  `;

  const dom = new JSDOM(MODERN_FAP_GRADE_HTML, {
    url: "https://fap.fpt.edu.vn/Report/Grade?termId=01a07c76-b178-78de-b4c0-96dcec4717e4&courseId=01a07c76-e546-76e2-8e02-b620de7d1b65"
  });
  const doc = dom.window.document;

  const table = findFapGradeTable(doc);
  assert.ok(table, "Modern grade table is found by findFapGradeTable");

  const parsed = parseFapGradeTable(table);
  assert.strictEqual(parsed.average, 7.0);
  assert.strictEqual(parsed.status, "Passed");
  assert.strictEqual(parsed.bonus, 0);
  assert.strictEqual(parsed.categories.length, 3);
  assert.strictEqual(parsed.categories[0].category, "Kiến thức và kỹ năng chuyên môn");
  assert.strictEqual(parsed.categories[0].weight, 40);
  assert.strictEqual(parsed.categories[0].value, 7.0);
  assert.strictEqual(parsed.categories[1].category, "Kỹ năng mềm");
  assert.strictEqual(parsed.categories[1].weight, 30);
  assert.strictEqual(parsed.categories[1].value, 6.0);
  assert.strictEqual(parsed.categories[2].category, "Thái độ");
  assert.strictEqual(parsed.categories[2].weight, 30);
  assert.strictEqual(parsed.categories[2].value, 8.0);

  const controls = getGradePageControls(doc);
  assert.strictEqual(controls.ok, true);
  assert.strictEqual(controls.courses.length, 2);
  assert.strictEqual(controls.courses[0].courseCode, "OJT202");
  assert.strictEqual(controls.courses[0].courseName, "On-The-Job Training");
  assert.strictEqual(controls.courses[0].isActive, true);
  assert.strictEqual(controls.courses[1].courseCode, "ENW493C");
  assert.strictEqual(controls.courses[1].courseName, "Research Methods & Academic Writing Skills");
  assert.strictEqual(controls.courses[1].isActive, false);

  const grade = extractStudentGradeFromPage(doc);
  assert.ok(grade, "Full grade object extracted");
  assert.strictEqual(grade.courseCode, "OJT202");
  assert.strictEqual(grade.courseName, "On-The-Job Training");
  assert.strictEqual(grade.term, "Spring2026");
  assert.strictEqual(grade.average, 7.0);
  assert.strictEqual(grade.status, "Passed");

  const scoreInfo = calculateCurrentScore(grade.categories, grade.bonus);
  assert.strictEqual(scoreInfo.completedWeight, 100);
  assert.strictEqual(scoreInfo.remainingWeight, 0);
  assert.strictEqual(scoreInfo.currentWeightedScore, 7.0);
});

test("findGradeCourseSelect correctly targets course select and ignores term select in modern FAP", () => {
  const TWO_SELECT_HTML = `
    <div class="row g-3">
        <div class="col-md-6">
            <label for="grade-report-term" class="form-label">Học kỳ</label>
            <select id="grade-report-term" class="form-select academic-report-term-select">
                    <option value="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12" selected="selected">
                        Fall2026
                    </option>
                    <option value="01a07c76-b178-7e35-8083-ab4b837719c3" data-fallback-href="/Report/Grade?termId=01a07c76-b178-7e35-8083-ab4b837719c3">
                        Summer2026
                    </option>
                    <option value="01a07c76-b178-78de-b4c0-96dcec4717e4" data-fallback-href="/Report/Grade?termId=01a07c76-b178-78de-b4c0-96dcec4717e4">
                        Spring2026
                    </option>
            </select>
        </div>
        <div class="col-md-6">
            <label for="grade-report-course" class="form-label">Lớp học</label>
            <select id="grade-report-course" class="form-select academic-report-course-select">
                    <option value="01a07c76-e867-76a6-ba26-8fc81e7fb5ee" data-report-term-id="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12&amp;courseId=01a07c76-e867-76a6-ba26-8fc81e7fb5ee" selected="selected">
                        Ethics in IT (ITE302c) (SE1938-NJ)
                    </option>
                    <option value="01a07c76-e8ef-7d5d-953c-d9e11eb7e3bd" data-report-term-id="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12&amp;courseId=01a07c76-e8ef-7d5d-953c-d9e11eb7e3bd">
                        Experiential Entrepreneurship 2 (EXE201) (GD1911-AD)
                    </option>
                    <option value="01a0dc8e-8bc9-720a-a9c2-4c35b941665e" data-report-term-id="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12&amp;courseId=01a0dc8e-8bc9-720a-a9c2-4c35b941665e">
                        Group Experiential Entrepreneurship 2 (EXE201g) (GD1911-AD_03)
                    </option>
                    <option value="01a07c76-e8ec-7a90-809a-eada3b34672b" data-report-term-id="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12&amp;courseId=01a07c76-e8ec-7a90-809a-eada3b34672b">
                        Mobile Programming (PRM393) (SE1938-NJ)
                    </option>
                    <option value="01a07c76-e869-7e69-a93e-ebf19eef4c53" data-report-term-id="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12&amp;courseId=01a07c76-e869-7e69-a93e-ebf19eef4c53">
                        Philosophy of Marxism – Leninism (MLN111) (SE1938-NJ)
                    </option>
                    <option value="01a07c76-e86a-7e41-a942-4a67cea3a18b" data-report-term-id="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12&amp;courseId=01a07c76-e86a-7e41-a942-4a67cea3a18b">
                        Political economics of Marxism – Leninism (MLN122) (SE1938-NJ)
                    </option>
                    <option value="01a07c76-e8a5-7353-ae1a-f70cd8fe9ebb" data-report-term-id="01a07c76-b178-728a-a70c-bfdc515d2b12" data-fallback-href="/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12&amp;courseId=01a07c76-e8a5-7353-ae1a-f70cd8fe9ebb">
                        Web Development Project (WDP301) (SE1938-NJ)
                    </option>
            </select>
        </div>
    </div>
  `;

  const dom = new JSDOM(TWO_SELECT_HTML, {
    url: "https://fap.fpt.edu.vn/Report/Grade?termId=01a07c76-b178-728a-a70c-bfdc515d2b12"
  });
  const doc = dom.window.document;

  const courses = getGradePageCourses(doc);
  assert.strictEqual(courses.length, 7, "Must extract 7 courses from course select, NOT semesters");
  assert.strictEqual(courses[0].courseCode, "ITE302C");
  assert.strictEqual(courses[0].courseName, "Ethics in IT");
  assert.strictEqual(courses[0].isActive, true);
  assert.strictEqual(courses[1].courseCode, "EXE201");
  assert.strictEqual(courses[2].courseCode, "EXE201G");
  assert.strictEqual(courses[3].courseCode, "PRM393");
  assert.strictEqual(courses[4].courseCode, "MLN111");
  assert.strictEqual(courses[5].courseCode, "MLN122");
  assert.strictEqual(courses[6].courseCode, "WDP301");

  const controls = getGradePageControls(doc);
  assert.strictEqual(controls.term, "Fall2026");
  assert.strictEqual(controls.courses.length, 7);
});



