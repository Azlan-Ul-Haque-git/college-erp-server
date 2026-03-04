// seed.js — Demo data setup
// Copy this file to D:\college-erp\server\
// Run: node seed.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/college_erp";

// ── Schemas (inline for seed script) ──
const userSchema = new mongoose.Schema({
    name: String, email: { type: String, unique: true },
    password: String, role: String,
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rollNo: String, branch: String, year: Number,
    semester: Number, section: String,
    admissionNo: String, parentName: String, parentPhone: String,
    faceData: { type: String, default: "" },
}, { timestamps: true });

const facultySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeId: String, department: String,
    designation: { type: String, default: "Lecturer" },
    subjects: [String], qualification: String,
    experience: { type: Number, default: 0 },
}, { timestamps: true });

const noticeSchema = new mongoose.Schema({
    title: String, content: String,
    category: { type: String, default: "general" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetRole: { type: String, default: "all" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const feesSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    totalAmount: Number, paidAmount: { type: Number, default: 0 },
    dueAmount: Number, status: { type: String, default: "Unpaid" },
    semester: Number, academicYear: String,
    transactions: [],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Student = mongoose.model("Student", studentSchema);
const Faculty = mongoose.model("Faculty", facultySchema);
const Notice = mongoose.model("Notice", noticeSchema);
const Fees = mongoose.model("Fees", feesSchema);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing data
        await User.deleteMany({});
        await Student.deleteMany({});
        await Faculty.deleteMany({});
        await Notice.deleteMany({});
        await Fees.deleteMany({});
        console.log("🗑️  Cleared old data");

        const hash = async (p) => await bcrypt.hash(p, 12);

        // ── Admin ──
        const adminUser = await User.create({
            name: "Super Admin", email: "admin@college.edu",
            password: await hash("admin123"), role: "admin", phone: "9999999999",
        });
        console.log("✅ Admin created");

        // ── Faculty ──
        const f1User = await User.create({ name: "Prof. Rajesh Kumar", email: "faculty@college.edu", password: await hash("faculty123"), role: "faculty", phone: "9888888881" });
        const f2User = await User.create({ name: "Prof. Sunita Sharma", email: "sunita@college.edu", password: await hash("faculty123"), role: "faculty", phone: "9888888882" });
        const f3User = await User.create({ name: "Prof. Amit Verma", email: "amit@college.edu", password: await hash("faculty123"), role: "faculty", phone: "9888888883" });

        await Faculty.create({ user: f1User._id, employeeId: "FAC001", department: "CSE", designation: "Associate Professor", subjects: ["Data Structures", "Algorithms", "DBMS"], qualification: "M.Tech", experience: 8 });
        await Faculty.create({ user: f2User._id, employeeId: "FAC002", department: "IT", designation: "Assistant Professor", subjects: ["Operating Systems", "Computer Networks"], qualification: "M.Tech", experience: 5 });
        await Faculty.create({ user: f3User._id, employeeId: "FAC003", department: "CSE", designation: "Lecturer", subjects: ["Software Engineering", "Web Tech"], qualification: "B.Tech", experience: 3 });
        console.log("✅ Faculty created (3)");

        // ── Students ──
        const studentsData = [
            { name: "Rahul Sharma", email: "student@college.edu", phone: "9777777771", rollNo: "CSE2021001", branch: "CSE", year: 3, semester: 5, section: "A" },
            { name: "Priya Verma", email: "priya@college.edu", phone: "9777777772", rollNo: "CSE2021002", branch: "CSE", year: 3, semester: 5, section: "A" },
            { name: "Amit Singh", email: "amit.s@college.edu", phone: "9777777773", rollNo: "CSE2021003", branch: "CSE", year: 3, semester: 5, section: "A" },
            { name: "Neha Gupta", email: "neha@college.edu", phone: "9777777774", rollNo: "IT2021001", branch: "IT", year: 3, semester: 5, section: "B" },
            { name: "Rohan Patel", email: "rohan@college.edu", phone: "9777777775", rollNo: "IT2021002", branch: "IT", year: 3, semester: 5, section: "B" },
        ];

        for (const s of studentsData) {
            const u = await User.create({ name: s.name, email: s.email, password: await hash("student123"), role: "student", phone: s.phone });
            const st = await Student.create({ user: u._id, rollNo: s.rollNo, branch: s.branch, year: s.year, semester: s.semester, section: s.section, admissionNo: `ADM${s.rollNo}`, parentName: `Parent of ${s.name}`, parentPhone: "9666666666" });
            // Create fees for each student
            await Fees.create({ student: st._id, totalAmount: 45000, paidAmount: s.email === "student@college.edu" ? 45000 : 22500, dueAmount: s.email === "student@college.edu" ? 0 : 22500, status: s.email === "student@college.edu" ? "Paid" : "Partial", semester: 5, academicYear: "2024-25" });
        }
        console.log("✅ Students created (5)");

        // ── Notices ──
        await Notice.create({ title: "Mid-term Examination Schedule", content: "Mid-term exams will be held from 15th March to 22nd March 2025. Students are advised to check the detailed timetable on the notice board.", category: "exam", postedBy: adminUser._id, targetRole: "all" });
        await Notice.create({ title: "Holiday Notice - Holi", content: "College will remain closed on 14th March 2025 on account of Holi festival.", category: "holiday", postedBy: adminUser._id, targetRole: "all" });
        await Notice.create({ title: "Project Submission Deadline", content: "All final year students must submit their project reports by 30th March 2025.", category: "urgent", postedBy: adminUser._id, targetRole: "student" });
        await Notice.create({ title: "Faculty Meeting", content: "All faculty members are requested to attend the department meeting on 10th March at 2 PM in the conference room.", category: "general", postedBy: adminUser._id, targetRole: "faculty" });
        console.log("✅ Notices created (4)");

        console.log("\n========================================");
        console.log("  SEED COMPLETE! Demo credentials:");
        console.log("========================================");
        console.log("  ADMIN:   admin@college.edu   / admin123");
        console.log("  FACULTY: faculty@college.edu / faculty123");
        console.log("  STUDENT: student@college.edu / student123");
        console.log("========================================\n");

        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
        process.exit(1);
    }
}

seed();