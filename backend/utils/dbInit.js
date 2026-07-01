import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import User from '../models/User.js';
import Category from '../models/Category.js';
import Department from '../models/Department.js';
import Faculty from '../models/Faculty.js';
import Article from '../models/Article.js';
import Revision from '../models/Revision.js';
import Comment from '../models/Comment.js';

// Resolve current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const categoriesData = [
  { name: 'Departments', description: 'Academic departments and disciplines at IITGN' },
  { name: 'Faculty', description: 'Faculty members, profiles and research domains' },
  { name: 'Courses', description: 'Undergraduate and postgraduate courses syllabus' },
  { name: 'Research & Labs', description: 'Research centers, initiatives, and advanced research facilities' },
  { name: 'Hostels', description: 'Student housing, mess facilities, and residential life' },
  { name: 'Campus & Facilities', description: 'Lal Bahadur Shastri Library, Sports Complex, and housing' },
  { name: 'Student Clubs & Gymkhana', description: 'Cultural, technical, sports clubs, and student government' },
  { name: 'Institute Policies', description: 'Academic guidelines, honor codes, and safety policies' },
  { name: 'Administration', description: 'Leadership, director, senate, and administrative departments' },
  { name: 'Student Life', description: 'Fests like Amalthea, Blithchron, Hallbol, and campus culture' },
  { name: 'Miscellaneous', description: 'General information, transport schedules, and FAQs' },
];

const departmentsData = [
  { name: 'Computer Science & Engineering', code: 'CSE', headOfDepartment: 'Prof. Neeldhara Misra', website: 'https://cse.iitgn.ac.in' },
  { name: 'Electrical Engineering', code: 'EE', headOfDepartment: 'Prof. Naran Pindoriya', website: 'https://ee.iitgn.ac.in' },
  { name: 'Mechanical Engineering', code: 'ME', headOfDepartment: 'Prof. Amit Prashant', website: 'https://me.iitgn.ac.in' },
  { name: 'Chemical Engineering', code: 'CL', headOfDepartment: 'Prof. Chinmay Ghoroi', website: 'https://che.iitgn.ac.in' },
  { name: 'Civil Engineering', code: 'CE', headOfDepartment: 'Prof. Pranab Kumar Mohapatra', website: 'https://ce.iitgn.ac.in' },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iitgn-wiki';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing database tables...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Department.deleteMany({});
    await Faculty.deleteMany({});
    await Article.deleteMany({});
    await Revision.deleteMany({});
    await Comment.deleteMany({});

    console.log('Seeding Users...');
    // Seed Admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@iitgn.ac.in',
      password: 'password123',
      role: 'Admin',
      department: 'CSE',
      batch: 'Staff',
      bio: 'Knowledge platform administrator and editor.',
      badges: ['Founder', 'Admin', 'Gold Contributor'],
    });

    // Seed Moderator
    const modUser = await User.create({
      name: 'Dr. Neeldhara Misra',
      email: 'neeldhara.m@iitgn.ac.in',
      password: 'password123',
      role: 'Moderator',
      department: 'CSE',
      batch: 'Faculty',
      bio: 'Faculty member in Computer Science & Engineering. Passionate about algorithms and education.',
      badges: ['Moderator', 'Academic Leader'],
    });

    // Seed Student
    const studentUser = await User.create({
      name: 'Himanshu Patel',
      email: 'student@iitgn.ac.in',
      password: 'password123',
      role: 'Student',
      department: 'Electrical Engineering',
      batch: '2023-2027',
      bio: 'Undergraduate student. Loves contributing to campus community portals.',
      interests: ['Robotics', 'Web Development', 'Cricket'],
      badges: ['Novice Writer'],
    });

    console.log('Seeding Categories...');
    const categoriesMap = {};
    for (const cat of categoriesData) {
      const slug = cat.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
      const createdCat = await Category.create({
        name: cat.name,
        slug,
        description: cat.description,
      });
      categoriesMap[cat.name] = createdCat._id;
    }

    console.log('Seeding Departments...');
    const deptsMap = {};
    for (const dept of departmentsData) {
      const createdDept = await Department.create(dept);
      deptsMap[dept.code] = createdDept._id;
    }

    console.log('Seeding Faculty...');
    const faculty1 = await Faculty.create({
      name: 'Prof. Neeldhara Misra',
      email: 'neeldhara.m@iitgn.ac.in',
      department: deptsMap['CSE'],
      designation: 'Associate Professor',
      researchInterests: ['Algorithms', 'Combinatorics', 'Theoretical Computer Science'],
      office: 'Academic Block 6, Room 314',
      website: 'https://neeldhara.com',
    });

    const faculty2 = await Faculty.create({
      name: 'Prof. Amit Prashant',
      email: 'ap@iitgn.ac.in',
      department: deptsMap['CE'],
      designation: 'Professor',
      researchInterests: ['Geotechnical Engineering', 'Soil Mechanics', 'Infrastructure'],
      office: 'Academic Block 3, Room 102',
      website: 'https://iitgn.ac.in/faculty/civil/ap.htm',
    });

    console.log('Seeding Articles...');

    // Article 1: About IIT Gandhinagar
    const art1Content = `# Indian Institute of Technology Gandhinagar (IITGN)

The **Indian Institute of Technology Gandhinagar** (commonly known as **IITGN**) is a public engineering institution located in Gandhinagar, Gujarat, India. It has been declared as an Institute of National Importance by the Government of India. 

Established in 2008, the institute is located on a scenic 400-acre campus along the banks of the Sabarmati River in Palaj, Gandhinagar.

## Campus Life
IITGN is renowned for its 5-star GRIHA rated green campus. The student community is highly residential, with modern hostels equipped with air-cooling, clean mess facilities, and active sports clubs.

### Core Values
- **Student-Centricity:** The institute promotes freedom of choices in academics and student life.
- **Interdisciplinary Approach:** Students can choose double majors, minors, and interdisciplinary project modules.
- **Integrity and Honor:** Governed by a student-run Honor Code.

## Academic Programs
IITGN offers undergraduate B.Tech programs, postgraduate M.Tech and M.Sc programs, and doctoral research fellowships.

* **Departments:** [[computer-science-department]], [[electrical-engineering-department]]
* **Culture:** [[amalthea-tech-fest]], [[hostel-life-at-iitgn]]

## References
1. IIT Gandhinagar Official Portal: https://iitgn.ac.in
2. GRIHA Rating Authority Reports: https://grihaindia.org
`;

    const art1 = await Article.create({
      title: 'Indian Institute of Technology Gandhinagar',
      slug: 'indian-institute-of-technology-gandhinagar',
      category: categoriesMap['Campus & Facilities'],
      content: art1Content,
      bannerImage: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      tags: ['IITGN', 'Overview', 'Campus', 'Gujarat'],
      author: adminUser._id,
      status: 'Approved',
      views: 1245,
      version: 1,
      references: [
        { title: 'IIT Gandhinagar Official Website', url: 'https://iitgn.ac.in' },
        { title: 'GRIHA Green Rating Reports', url: 'https://grihaindia.org' }
      ]
    });

    await Revision.create({
      article: art1._id,
      editor: adminUser._id,
      version: 1,
      summary: 'Initial wiki overview setup.',
      contentSnapshot: art1Content,
    });

    // Article 2: Computer Science Department
    const art2Content = `# Computer Science & Engineering Department

The **Computer Science & Engineering** discipline at IIT Gandhinagar offers a highly flexible and research-focused undergraduate and postgraduate curriculum. 

## Research Groups
- **Theory & Algorithms:** Focusing on parameterized complexity, graph algorithms, and formal logic. Lead: [[prof-neeldhara-misra]]
- **Data Science & ML:** Machine learning applications, NLP, and Big Data databases.
- **Systems & Networks:** High-performance computing, virtualization, and systems security.

## Academic Courses
IITGN CS discipline has a unique curriculum with courses such as:
1. Data Structures & Algorithms
2. Theory of Computation
3. Machine Learning & Optimization
4. Introduction to Computing (Common to all disciplines)

## Facilities
Students have access to the state-of-the-art **Supercomputing Lab** housing the Param Ananta supercomputer.

## References
1. CSE Discipline Portal: https://cse.iitgn.ac.in
`;

    const art2 = await Article.create({
      title: 'Computer Science Department',
      slug: 'computer-science-department',
      category: categoriesMap['Departments'],
      content: art2Content,
      tags: ['CSE', 'Academics', 'Coding', 'Theory'],
      author: modUser._id,
      status: 'Approved',
      views: 752,
      version: 1,
      references: [
        { title: 'IITGN CSE Department Portal', url: 'https://cse.iitgn.ac.in' }
      ]
    });

    await Revision.create({
      article: art2._id,
      editor: modUser._id,
      version: 1,
      summary: 'Seed department page.',
      contentSnapshot: art2Content,
    });

    // Article 3: Hostel Life
    const art3Content = `# Hostel Life at IITGN

The residential experience is one of the pillars of life at IIT Gandhinagar. The campus houses over 12 modern hostels, fully air-cooled, with single/double accommodation systems.

## Hostel Blocks
Hostels are named after major Indian rivers and mountain peaks:
- **Aibak (Hostel A)**
- **Beau (Hostel B)**
- **Kalyan**
- **Mahanadi**
- **Narmada**

## Facilities
- **Air-cooling:** All student rooms are connected to an eco-friendly central evaporative air-cooling system.
- **Common Rooms:** Equipped with LED TVs, Table Tennis, Chessboards, and seating.
- **Pantry:** Equipped with microwaves, induction stoves, and hot water dispensers for late-night snacks.
- **Laundry:** Free automated laundry washers and dryers in each hostel block.

## Mess Operations
The student-run **Mess Council** oversees diet planning, menu reviews, and hygiene audits.

## References
- IITGN Hostel Guidelines, 2024.
`;

    const art3 = await Article.create({
      title: 'Hostel Life at IITGN',
      slug: 'hostel-life-at-iitgn',
      category: categoriesMap['Hostels'],
      content: art3Content,
      tags: ['Hostel', 'Campus Life', 'Residences', 'Mess'],
      author: studentUser._id,
      status: 'Approved',
      views: 520,
      version: 1,
      references: [
        { title: 'IITGN Student Housing Council Handbook' }
      ]
    });

    await Revision.create({
      article: art3._id,
      editor: studentUser._id,
      version: 1,
      summary: 'Add general hostel info and block names.',
      contentSnapshot: art3Content,
    });

    // Article 4: Student Gymkhana
    const art4Content = `# Student Gymkhana

The **Student Gymkhana** is the central student representative body at IIT Gandhinagar. It operates as a platform to coordinate and enhance extracurricular activities and represent student interests before the institute administration.

## Composition
The Gymkhana is led by the **Student Senate** and the Executive Committee which includes:
- **Student President**
- **Academic Secretary**
- **Cultural Secretary**
- **Technical Secretary**
- **Sports Secretary**

## Clubs under Gymkhana
Students run numerous clubs categorized as:

### Cultural Clubs
- **Music Club:** Live bands and vocal workshops.
- **Dance Club:** Organizes street dance and choreo battles.
- **Art Club:** Canvas painting and campus wall art.

### Technical Clubs
- **Metis (Coding Club):** Competitive coding, hackathons, and web dev.
- **Robotics Club:** Autonomous bots and drone challenges.
- **Odigos (Astronomy Club):** Skygazing sessions from the hostel roofs.

## References
1. IITGN Student Gymkhana Constitution.
`;

    const art4 = await Article.create({
      title: 'Student Gymkhana',
      slug: 'student-gymkhana',
      category: categoriesMap['Student Clubs & Gymkhana'],
      content: art4Content,
      tags: ['Gymkhana', 'Student Council', 'Clubs', 'Extracurricular'],
      author: studentUser._id,
      status: 'Approved',
      views: 310,
      version: 1,
    });

    await Revision.create({
      article: art4._id,
      editor: studentUser._id,
      version: 1,
      summary: 'Gymkhana constitution and clubs overview.',
      contentSnapshot: art4Content,
    });

    // Article 5: Prof. Neeldhara Misra
    const art5Content = `# Prof. Neeldhara Misra

**Prof. Neeldhara Misra** is an Associate Professor in the [[computer-science-department]] at the [[indian-institute-of-technology-gandhinagar]].

## Academic Biography
She completed her PhD from the Institute of Mathematical Sciences (IMSc), Chennai under the supervision of Prof. Saket Saurabh. She is widely known for her research on parameterized algorithms, computational social choice, and graph theory.

## Research Areas
- **Parameterized Complexity:** Finding efficient algorithms for NP-hard problems using parameters.
- **Computational Social Choice:** Designing fair voting mechanisms and resource allocation systems.
- **Theory & Graph Algorithms:** Analyzing graph properties and structural complexity.

## Teaching & Courses
- Data Structures & Algorithms (CSE)
- Theory of Computation
- Computational Social Choice seminars

## References
1. Personal Profile Portal: https://neeldhara.com
2. IITGN Faculty Directory: https://iitgn.ac.in/faculty/cse/neeldhara
`;

    const art5 = await Article.create({
      title: 'Prof. Neeldhara Misra',
      slug: 'prof-neeldhara-misra',
      category: categoriesMap['Faculty'],
      content: art5Content,
      tags: ['Faculty', 'Algorithms', 'Theory', 'CSE'],
      author: adminUser._id,
      status: 'Approved',
      views: 412,
      version: 1,
      references: [
        { title: 'Prof. Neeldhara Misra website', url: 'https://neeldhara.com' }
      ]
    });

    await Revision.create({
      article: art5._id,
      editor: adminUser._id,
      version: 1,
      summary: 'Add faculty academic profile.',
      contentSnapshot: art5Content,
    });

    // Article 6: Amalthea Tech Fest
    const art6Content = `# Amalthea Tech Fest

**Amalthea** is the annual student-run technical summit of the [[indian-institute-of-technology-gandhinagar]]. Founded in 2010, it is a premier technical festival in Western India.

Unlike other student fests, Amalthea focuses heavily on bridging the gap between industry, research academies, and students.

## Segments of Amalthea
- **Conclave:** Talks by prominent speakers. Past speakers include founders, scientists, and defense personnel.
- **Exhibition:** Showcasing projects from government organizations (ISRO, DRDO) and tech companies.
- **Symposium:** Academic paper presentations and research seminars.
- **Technical Events:** Includes RoboQuest (robotics build battle), D’Code (competitive coding), and drift-racing.

## References
1. Amalthea Portal: https://amalthea.iitgn.ac.in
`;

    const art6 = await Article.create({
      title: 'Amalthea Tech Fest',
      slug: 'amalthea-tech-fest',
      category: categoriesMap['Student Life'],
      content: art6Content,
      tags: ['Amalthea', 'Fest', 'Technical', 'Events'],
      author: studentUser._id,
      status: 'Approved',
      views: 610,
      version: 1,
      references: [
        { title: 'Amalthea Official Portal', url: 'https://amalthea.iitgn.ac.in' }
      ]
    });

    await Revision.create({
      article: art6._id,
      editor: studentUser._id,
      version: 1,
      summary: 'Add Amalthea technical summit details.',
      contentSnapshot: art6Content,
    });

    // Article 7: Placement Stats
    const art7Content = `# Placement Stats

The Career Development Services (CDS) at the [[indian-institute-of-technology-gandhinagar]] manages internships, industrial relations, and placement drives.

## Placement Summary (Recent Batch)
The placement season saw participation from over 120 recruiters across technology, consulting, research, and core engineering industries.

- **Placement Percentage:** 91.5%
- **Highest Package:** INR 52.4 LPA (Domestic)
- **Average Package:** INR 19.6 LPA
- **Median Package:** INR 15.2 LPA

## Top Recruiting Partners
- **Technology:** Google, Microsoft, Amazon, Oracle, Adobe.
- **Finance & Analytics:** Barclays, Goldman Sachs, JPMorgan Chase.
- **Core Engineering:** Tata Motors, L&T, Siemens.

## References
1. CDS IITGN Placement Report, 2024.
`;

    const art7 = await Article.create({
      title: 'Placement Stats',
      slug: 'placement-stats',
      category: categoriesMap['Miscellaneous'],
      content: art7Content,
      tags: ['Placements', 'CDS', 'Careers', 'Recruiting'],
      author: adminUser._id,
      status: 'Approved',
      views: 940,
      version: 1,
    });

    await Revision.create({
      article: art7._id,
      editor: adminUser._id,
      version: 1,
      summary: 'Initial placements data seeding.',
      contentSnapshot: art7Content,
    });

    // Article 8: Academic Honor Code
    const art8Content = `# Academic Honor Code

The **Academic Honor Code** is a set of guidelines governing ethical academic behavior for all students at the [[indian-institute-of-technology-gandhinagar]].

Every student at the time of admission pledges to uphold the Honor Code.

## Core Commitments
- **Self-Honesty:** Submitting work that is entirely one's own.
- **Anti-Plagiarism:** Properly citing references and sources of data.
- **No Malpractice:** Refraining from copying or sharing answers during examinations.

## Honor Code Committee (HCC)
The HCC is a student-majority committee that investigates reports of academic dishonesty and recommends disciplinary actions to the Senate.

## References
1. IITGN Academic Guidelines Handbook.
`;

    const art8 = await Article.create({
      title: 'Academic Honor Code',
      slug: 'academic-honor-code',
      category: categoriesMap['Institute Policies'],
      content: art8Content,
      tags: ['Policies', 'Ethics', 'Honor Code', 'Academics'],
      author: modUser._id,
      status: 'Approved',
      views: 310,
      version: 1,
    });

    await Revision.create({
      article: art8._id,
      editor: modUser._id,
      version: 1,
      summary: 'Seed Honor Code policy details.',
      contentSnapshot: art8Content,
    });

    console.log('Seeding Comments...');
    // Seed some comments on the articles
    await Comment.create({
      article: art3._id,
      author: studentUser._id,
      content: 'Can someone add the mess timings here? Especially the late-night tea hours.',
      parentComment: null,
    });

    const parentComm = await Comment.create({
      article: art2._id,
      author: studentUser._id,
      content: 'Is there any eligibility criteria to work at the Supercomputing Lab?',
      parentComment: null,
    });

    await Comment.create({
      article: art2._id,
      author: modUser._id,
      content: 'Any undergraduate student who has completed the "Operating Systems" or "Computer Networks" course can contact the lab manager for research projects.',
      parentComment: parentComm._id,
    });

    console.log('Database seeded successfully!');
    if (process.argv.includes('--seed')) {
      mongoose.connection.close();
      console.log('Database connection closed.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    if (process.argv.includes('--seed')) {
      process.exit(1);
    }
  }
};

// Check if run directly
if (process.argv.includes('--seed')) {
  seedDatabase();
}

export default seedDatabase;
