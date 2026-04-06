use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Class {
    pub id: i64,
    pub name: String,
    pub level: String,
    pub section: Option<String>,
    pub student_count: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Parent {
    pub id: i64,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub photo: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Staff {
    pub id: i64,
    #[serde(rename = "staffId")]
    pub staff_id: String,
    pub name: String,
    pub role: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub subject: Option<String>,
    #[serde(rename = "classId")]
    pub class_id: Option<i64>,
    pub class: Option<ClassBasic>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClassBasic {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Student {
    pub id: i64,
    #[serde(rename = "studentId")]
    pub student_id: String,
    pub name: String,
    pub gender: String,
    pub dob: String,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub photo: Option<String>,
    #[serde(rename = "classId")]
    pub class_id: i64,
    #[serde(rename = "parentId")]
    pub parent_id: Option<i64>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    pub status: String,
    pub class: Option<ClassBasic>,
    pub parent: Option<ParentBasic>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParentBasic {
    pub id: i64,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subject {
    pub id: i64,
    pub name: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResultRow {
    pub id: i64,
    #[serde(rename = "studentId")]
    pub student_id: i64,
    #[serde(rename = "subjectId")]
    pub subject_id: i64,
    pub term: String,
    pub year: String,
    pub ca: f64,
    pub exam: f64,
    pub total: f64,
    pub grade: String,
    pub remark: Option<String>,
    pub student: Option<StudentBasic>,
    pub subject: Option<SubjectBasic>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudentBasic {
    pub id: i64,
    pub name: String,
    #[serde(rename = "studentId")]
    pub student_id: String,
    pub class: Option<ClassBasic>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubjectBasic {
    pub id: i64,
    pub name: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    pub id: i64,
    #[serde(rename = "studentId")]
    pub student_id: i64,
    pub term: String,
    pub year: String,
    #[serde(rename = "feeType")]
    pub fee_type: String,
    pub amount: f64,
    pub paid: f64,
    pub balance: f64,
    #[serde(rename = "datePaid")]
    pub date_paid: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    pub student: Option<StudentWithClass>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudentWithClass {
    pub id: i64,
    pub name: String,
    #[serde(rename = "studentId")]
    pub student_id: String,
    pub class: ClassBasic,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SchoolSettings {
    pub id: i64,
    #[serde(rename = "schoolName")]
    pub school_name: String,
    pub motto: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub logo: Option<String>,
    #[serde(rename = "currentTerm")]
    pub current_term: String,
    #[serde(rename = "currentYear")]
    pub current_year: String,
    #[serde(rename = "nextTermName")]
    pub next_term_name: Option<String>,
    #[serde(rename = "nextTermFee")]
    pub next_term_fee: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub role: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CAScore {
    pub id: i64,
    #[serde(rename = "studentId")]
    pub student_id: i64,
    #[serde(rename = "subjectId")]
    pub subject_id: i64,
    pub term: String,
    pub year: String,
    #[serde(rename = "classExercise")]
    pub class_exercise: Option<f64>,
    #[serde(rename = "homeWork")]
    pub home_work: Option<f64>,
    #[serde(rename = "classTest")]
    pub class_test: Option<f64>,
    #[serde(rename = "midTermExam")]
    pub mid_term_exam: Option<f64>,
    #[serde(rename = "computedCA")]
    pub computed_ca: Option<f64>,
    pub student: Option<StudentBasic>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CAScoreEntry {
    pub id: i64,
    #[serde(rename = "studentId")]
    pub student_id: i64,
    #[serde(rename = "subjectId")]
    pub subject_id: i64,
    pub term: String,
    pub year: String,
    #[serde(rename = "assessmentType")]
    pub assessment_type: String,
    pub score: f64,
    #[serde(rename = "maxScore")]
    pub max_score: f64,
    pub student: Option<StudentBasic>,
}

// ─── Input types ─────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct CreateClassInput {
    pub name: String,
    pub level: String,
    pub section: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateParentInput {
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub photo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateParentInput {
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub photo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStaffInput {
    pub name: String,
    pub role: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub subject: Option<String>,
    #[serde(rename = "classId")]
    pub class_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStaffInput {
    pub name: Option<String>,
    pub role: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub subject: Option<String>,
    #[serde(rename = "classId")]
    pub class_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStudentInput {
    pub name: String,
    pub gender: String,
    pub dob: String,
    #[serde(rename = "classId")]
    pub class_id: i64,
    #[serde(rename = "parentId")]
    pub parent_id: Option<i64>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub photo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStudentInput {
    pub name: Option<String>,
    pub gender: Option<String>,
    pub dob: Option<String>,
    #[serde(rename = "classId")]
    pub class_id: Option<i64>,
    #[serde(rename = "parentId")]
    pub parent_id: Option<i64>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub photo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubjectInput {
    pub name: String,
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct AddCAEntryInput {
    #[serde(rename = "studentId")]
    pub student_id: i64,
    #[serde(rename = "subjectId")]
    pub subject_id: i64,
    pub term: String,
    pub year: String,
    #[serde(rename = "assessmentType")]
    pub assessment_type: String,
    pub score: f64,
    #[serde(rename = "maxScore")]
    pub max_score: f64,
}

#[derive(Debug, Deserialize)]
pub struct BatchAddCAEntry {
    #[serde(rename = "studentId")]
    pub student_id: i64,
    pub score: f64,
}

#[derive(Debug, Deserialize)]
pub struct BatchAddCAInput {
    #[serde(rename = "subjectId")]
    pub subject_id: i64,
    pub term: String,
    pub year: String,
    #[serde(rename = "assessmentType")]
    pub assessment_type: String,
    #[serde(rename = "maxScore")]
    pub max_score: f64,
    pub entries: Vec<BatchAddCAEntry>,
}

#[derive(Debug, Deserialize)]
pub struct CreateResultInput {
    #[serde(rename = "studentId")]
    pub student_id: i64,
    #[serde(rename = "subjectId")]
    pub subject_id: i64,
    pub term: String,
    pub year: String,
    pub ca: f64,
    pub exam: f64,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct CreatePaymentInput {
    #[serde(rename = "studentId")]
    pub student_id: i64,
    pub term: String,
    #[serde(rename = "feeType")]
    pub fee_type: String,
    pub amount: f64,
    pub paid: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSettingsInput {
    #[serde(rename = "schoolName")]
    pub school_name: String,
    pub motto: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    #[serde(rename = "currentTerm")]
    pub current_term: String,
    #[serde(rename = "currentYear")]
    pub current_year: String,
    #[serde(rename = "nextTermName")]
    pub next_term_name: Option<String>,
    #[serde(rename = "nextTermFee")]
    pub next_term_fee: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentSummary {
    pub total: f64,
    pub collected: f64,
    pub outstanding: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReportCardData {
    pub student: StudentReportInfo,
    pub term: String,
    pub year: String,
    pub position: i64,
    #[serde(rename = "totalStudents")]
    pub total_students: i64,
    pub results: Vec<SubjectResult>,
    pub billing: Option<TermBilling>,
    pub attendance: AttendanceSummary,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudentReportInfo {
    pub name: String,
    #[serde(rename = "studentId")]
    pub student_id: String,
    pub class: String,
    pub gender: String,
    pub photo: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubjectResult {
    pub subject: String,
    pub ca: f64,
    pub exam: f64,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TermBilling {
    #[serde(rename = "feeType")]
    pub fee_type: String,
    pub amount: f64,
    pub paid: f64,
    pub balance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AttendanceSummary {
    #[serde(rename = "totalDays")]
    pub total_days: i64,
    pub present: i64,
    pub absent: i64,
    pub late: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AttendanceRow {
    #[serde(rename = "studentId")]
    pub student_id: i64,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct RecordAttendanceInput {
    #[serde(rename = "classId")]
    pub class_id: i64,
    pub date: String,
    pub term: String,
    pub year: String,
    pub records: Vec<AttendanceRow>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AttendanceEntry {
    pub id: i64,
    #[serde(rename = "studentId")]
    pub student_id: i64,
    pub name: String,
    pub status: String,
    pub date: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserInput {
    pub username: String,
    pub email: String,
    pub password: String,
    pub role: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserInput {
    pub username: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordInput {
    pub user_id: i64,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
pub struct PromoteClassInput {
    #[serde(rename = "classId")]
    pub class_id: i64,
    #[serde(rename = "nextClassId")]
    pub next_class_id: Option<i64>,   // None = graduate (JHS 3)
    #[serde(rename = "repeatStudentIds")]
    pub repeat_student_ids: Vec<i64>, // students who stay in same class
}

#[derive(Debug, Serialize)]
pub struct PromoteResult {
    pub promoted: i64,
    pub repeated: i64,
    pub graduated: i64,
}