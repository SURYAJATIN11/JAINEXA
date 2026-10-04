export type RoomCategory = "lecture" | "lab" | "faculty" | "admin" | "amenity";

export interface RoomHotspot {
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  width?: number; // relative width %
  height?: number; // relative height %
}

export interface BuildingRoom {
  id: string;
  code: string; // e.g. "A-204", "116", "002"
  name: string;
  floor: number; // 0, 1, 2, 3, 4
  block: string;
  category: RoomCategory;
  capacity: number;
  areaSqm: number;
  facilities: string[];
  description: string;
  hotspot?: RoomHotspot;
}

export interface FloorData {
  floorNumber: number;
  levelTitle: string;
  shortName: string;
  subtitle: string;
  cadImage: string;
  totalAreaSqm: number;
  totalRooms: number;
  highlights: string[];
  rooms: BuildingRoom[];
}

export const CAMPUS_FLOORS: FloorData[] = [
  // ==========================================
  // GROUND FLOOR (LEVEL 0)
  // ==========================================
  {
    floorNumber: 0,
    levelTitle: "Ground Floor (Level 0)",
    shortName: "Ground Floor",
    subtitle: "JU School of Engineering & Technology · Administrative Headquarters & Core Science Labs",
    cadImage: "/floorPlan/Floor-0.png",
    totalAreaSqm: 4200,
    totalRooms: 15,
    highlights: [
      "Vice Chancellor Chamber (A-007)",
      "Open-Air Amphitheatre (450+ capacity)",
      "Physics & Chemistry Labs (B-011, B-012 - 240 SQM each)",
      "University Seminar Hall (A-002 - 180 seats)"
    ],
    rooms: [
      {
        id: "r0-a001",
        code: "A-001",
        name: "Campus Administrative Office",
        floor: 0,
        block: "A - Block",
        category: "admin",
        capacity: 45,
        areaSqm: 240,
        facilities: ["Student Helpdesk", "Fee Counter", "Admissions Liaison", "LAN Server"],
        description: "Primary institutional administrative hall handling student registrations, fee verification, and institutional documentation.",
        hotspot: { x: 16.8, y: 54.5, width: 12, height: 8 }
      },
      {
        id: "r0-a002",
        code: "A-002",
        name: "Main University Seminar Hall",
        floor: 0,
        block: "A - Block",
        category: "amenity",
        capacity: 180,
        areaSqm: 240,
        facilities: ["Dual 4K Laser Projectors", "Dolby Audio", "Acoustic Paneling", "Central HVAC"],
        description: "Acoustically treated multi-tier seminar hall hosting conferences, faculty symposiums, and guest lectures.",
        hotspot: { x: 14.5, y: 43.8, width: 12, height: 8 }
      },
      {
        id: "r0-a003",
        code: "A-003",
        name: "Kemi-Faculty Room 1 & Conference Room",
        floor: 0,
        block: "A - Block",
        category: "faculty",
        capacity: 35,
        areaSqm: 240,
        facilities: ["16-Seat Conference Table", "Video Conferencing Bar", "High-speed Wi-Fi 6"],
        description: "Faculty research consultation and departmental review chamber.",
        hotspot: { x: 16.8, y: 33.8, width: 12, height: 8 }
      },
      {
        id: "r0-a004",
        code: "A-004",
        name: "Kemi-Lecture Hall & Faculty Room 2",
        floor: 0,
        block: "A - Block",
        category: "lecture",
        capacity: 75,
        areaSqm: 240,
        facilities: ["Interactive Smart Podium", "Audio Amplifiers", "Lecture Recording Rig"],
        description: "Multipurpose academic lecture hall and faculty liaison office.",
        hotspot: { x: 19.5, y: 24.0, width: 12, height: 7 }
      },
      {
        id: "r0-a005",
        code: "A-005",
        name: "Kemi Director Office",
        floor: 0,
        block: "A - Block",
        category: "admin",
        capacity: 12,
        areaSqm: 66,
        facilities: ["Executive Suite", "Secure Archive", "Direct Intercom"],
        description: "Office chamber of the KEMI Institute Director.",
        hotspot: { x: 33.5, y: 24.2, width: 6, height: 5 }
      },
      {
        id: "r0-a006",
        code: "A-006",
        name: "Kemi Admin Block",
        floor: 0,
        block: "A - Block",
        category: "admin",
        capacity: 20,
        areaSqm: 66,
        facilities: ["Student Helpdesk", "Records Counter", "Biometric Terminal"],
        description: "Administrative office handling student liaison and coordination.",
        hotspot: { x: 32.0, y: 36.0, width: 6, height: 5 }
      },
      {
        id: "r0-a007",
        code: "A-007",
        name: "Vice Chancellor Secretariat",
        floor: 0,
        block: "A - Block",
        category: "admin",
        capacity: 15,
        areaSqm: 55,
        facilities: ["Executive Board Lounge", "High-Security Video Suite"],
        description: "Official executive secretariat and chamber of the University Vice Chancellor.",
        hotspot: { x: 32.0, y: 46.5, width: 6, height: 5 }
      },
      {
        id: "r0-b008",
        code: "B-008",
        name: "Placement Office",
        floor: 0,
        block: "B - Block",
        category: "admin",
        capacity: 25,
        areaSqm: 66,
        facilities: ["Interview Rooms", "Corporate Relations Terminal", "Counseling Desks"],
        description: "Central training and placement office for campus recruitments and industry internships.",
        hotspot: { x: 41.0, y: 56.5, width: 5, height: 5 }
      },
      {
        id: "r0-b009",
        code: "B-009",
        name: "SIT Director Chamber",
        floor: 0,
        block: "B - Block",
        category: "admin",
        capacity: 15,
        areaSqm: 66,
        facilities: ["Director Chamber", "Conference Lounge"],
        description: "Office of the Director, School of Information Technology.",
        hotspot: { x: 50.8, y: 56.5, width: 5, height: 5 }
      },
      {
        id: "r0-b010",
        code: "B-010",
        name: "Campus Server Room & Data Center",
        floor: 0,
        block: "B - Block",
        category: "admin",
        capacity: 10,
        areaSqm: 55,
        facilities: ["Server Racks", "Dual Redundant UPS", "Precision Cooling", "Fiber Backbone"],
        description: "Core campus network infrastructure, web servers, and timetable computing nodes.",
        hotspot: { x: 63.0, y: 56.5, width: 5, height: 5 }
      },
      {
        id: "r0-b011",
        code: "B-011",
        name: "Chemistry Laboratory",
        floor: 0,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Fume Hoods", "Digital Spectrophotometers", "Emergency Eye-wash", "Reagent Storage"],
        description: "Undergraduate and computational chemistry laboratory.",
        hotspot: { x: 62.5, y: 69.5, width: 10, height: 10 }
      },
      {
        id: "r0-b012",
        code: "B-012",
        name: "Physics Laboratory",
        floor: 0,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Optics Darkroom", "Laser Benches", "Hall Effect Kits", "Dielectric Test Equipment"],
        description: "General engineering physics experimental and sensor calibration laboratory.",
        hotspot: { x: 53.0, y: 71.5, width: 9, height: 10 }
      },
      {
        id: "r0-b013",
        code: "B-013",
        name: "Faculty Room (Basic Sciences)",
        floor: 0,
        block: "B - Block",
        category: "faculty",
        capacity: 35,
        areaSqm: 240,
        facilities: ["Faculty Desks", "Discussion Cubicles", "Resource Library"],
        description: "Faculty workstation hall for professors of basic and computational sciences.",
        hotspot: { x: 43.5, y: 73.5, width: 9, height: 10 }
      },
      {
        id: "r0-b014",
        code: "B-014",
        name: "Executive Board Room",
        floor: 0,
        block: "B - Block",
        category: "admin",
        capacity: 35,
        areaSqm: 240,
        facilities: ["32-Seat Board Table", "Polycom Telepresence", "Motorized Screen"],
        description: "Official executive boardroom for Academic Council, Board of Governors, and Chancellor summits.",
        hotspot: { x: 33.5, y: 71.5, width: 9, height: 10 }
      },
      {
        id: "r0-amphi",
        code: "AMPHI",
        name: "Grand Open-Air Amphitheatre & Stage",
        floor: 0,
        block: "Central Courtyard",
        category: "amenity",
        capacity: 450,
        areaSqm: 650,
        facilities: ["Stepped Seating", "Stage Lighting", "Surround Sound Array"],
        description: "Iconic central open-air amphitheatre hosting campus cultural festivals, hackathon ceremonies, and convocations.",
        hotspot: { x: 53.5, y: 35.0, width: 16, height: 16 }
      }
    ]
  },

  // ==========================================
  // FIRST FLOOR (LEVEL 1)
  // ==========================================
  {
    floorNumber: 1,
    levelTitle: "Floor 1 (Level 1)",
    shortName: "1st Floor",
    subtitle: "JU School of Engineering & Technology · Lecture Halls, Electronics Labs & Mechanical Sciences",
    cadImage: "/floorPlan/Floor-1.png",
    totalAreaSqm: 4600,
    totalRooms: 26,
    highlights: [
      "Digital Electronics & Communication Labs (114, 115, 116)",
      "Computer Science Project Lab 124 & Computer Labs 125, 126",
      "Material Testing Lab (121), Machine Shop (122) & High Voltage Lab (123)",
      "Tiered Lecture Halls 101-103, 106-112, 127-A/B/C"
    ],
    rooms: [
      {
        id: "r1-a113",
        code: "A-113",
        name: "Seminar Hall 113",
        floor: 1,
        block: "A - Block",
        category: "amenity",
        capacity: 120,
        areaSqm: 240,
        facilities: ["Laser Projector", "Dolby Audio", "Tiered Seating"],
        description: "First-floor presentation and symposium hall for departmental talks.",
        hotspot: { x: 16.5, y: 60.5, width: 11, height: 7 }
      },
      {
        id: "r1-a114",
        code: "A-114",
        name: "Electronics Communication Lab 114",
        floor: 1,
        block: "A - Block",
        category: "lab",
        capacity: 55,
        areaSqm: 240,
        facilities: ["RF Signal Generators", "Antenna Test Benches", "Optical Fiber Kits"],
        description: "Laboratory for high-frequency signal processing and wireless communication.",
        hotspot: { x: 12.2, y: 51.5, width: 12, height: 7 }
      },
      {
        id: "r1-a115",
        code: "A-115",
        name: "Analog Electronic & Power Electronics Lab 115",
        floor: 1,
        block: "A - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Power Electronic Kits", "Thyristor Drives", "Digital Storage Oscilloscopes"],
        description: "Core electronics laboratory dedicated to analog circuits and power converters.",
        hotspot: { x: 14.5, y: 42.0, width: 12, height: 7 }
      },
      {
        id: "r1-a116",
        code: "A-116",
        name: "Digital Electronics Lab 116",
        floor: 1,
        block: "A - Block",
        category: "lab",
        capacity: 65,
        areaSqm: 240,
        facilities: ["FPGA Boards", "8086/ARM Kits", "Logic Analyzers", "IC Testers"],
        description: "Hands-on engineering lab for digital logic design and microprocessors.",
        hotspot: { x: 17.5, y: 33.0, width: 12, height: 7 }
      },
      {
        id: "r1-a101",
        code: "A-101",
        name: "Lecture Hall 101",
        floor: 1,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "Projection", "AC"],
        description: "Assigned for freshman engineering theory lectures.",
        hotspot: { x: 28.5, y: 54.0, width: 7, height: 4 }
      },
      {
        id: "r1-a102",
        code: "A-102",
        name: "Lecture Hall 102",
        floor: 1,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Screen", "Acoustic Wall Panels", "AC"],
        description: "Lecture hall assigned for basic engineering sciences.",
        hotspot: { x: 29.2, y: 44.0, width: 7, height: 4 }
      },
      {
        id: "r1-a103",
        code: "A-103",
        name: "Lecture Hall 103",
        floor: 1,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Interactive Display", "Mic Array", "Dual Projectors"],
        description: "Primary classroom assigned for Computer Science and Data Structures.",
        hotspot: { x: 31.4, y: 34.0, width: 7, height: 4 }
      },
      {
        id: "r1-d104",
        code: "D-104",
        name: "Tutorial Room 104",
        floor: 1,
        block: "D - Block",
        category: "lecture",
        capacity: 45,
        areaSqm: 65,
        facilities: ["Modular Desks", "Collaborative Whiteboards"],
        description: "Small-group interactive tutorial space for engineering mathematics.",
        hotspot: { x: 38.0, y: 26.0, width: 5, height: 5 }
      },
      {
        id: "r1-d105",
        code: "D-105",
        name: "Director CT Office 105",
        floor: 1,
        block: "D - Block",
        category: "admin",
        capacity: 15,
        areaSqm: 65,
        facilities: ["Director Chamber", "Meeting Table", "Executive Intercom"],
        description: "Directorate of Computing Technologies and Academic Program Oversight.",
        hotspot: { x: 49.6, y: 24.5, width: 5, height: 5 }
      },
      {
        id: "r1-c106",
        code: "C-106",
        name: "Lecture Hall 106",
        floor: 1,
        block: "C - Block",
        category: "lecture",
        capacity: 75,
        areaSqm: 65,
        facilities: ["Full HD Projection", "High-Gain Lavalier Audio", "Central HVAC"],
        description: "Assigned for core engineering lectures and common interdisciplinary electives.",
        hotspot: { x: 59.7, y: 24.5, width: 5, height: 5 }
      },
      {
        id: "r1-c107",
        code: "C-107",
        name: "Lecture Hall 107",
        floor: 1,
        block: "C - Block",
        category: "lecture",
        capacity: 75,
        areaSqm: 65,
        facilities: ["Multi-angle Cameras", "Automated Attendance Sensors"],
        description: "Lecture hall dedicated to Electrical & Electronics modules.",
        hotspot: { x: 68.1, y: 33.0, width: 6, height: 4 }
      },
      {
        id: "r1-c108",
        code: "C-108",
        name: "Lecture Hall 108",
        floor: 1,
        block: "C - Block",
        category: "lecture",
        capacity: 75,
        areaSqm: 65,
        facilities: ["Smart Podium", "Wireless Screen Casting"],
        description: "Lecture theatre for applied mechanics and thermal engineering.",
        hotspot: { x: 68.1, y: 42.5, width: 6, height: 4 }
      },
      {
        id: "r1-c109",
        code: "C-109",
        name: "Lecture Hall 109",
        floor: 1,
        block: "C - Block",
        category: "lecture",
        capacity: 75,
        areaSqm: 65,
        facilities: ["Interactive Screen", "Whiteboard"],
        description: "Assigned for mechanical and production engineering courses.",
        hotspot: { x: 67.0, y: 53.5, width: 6, height: 4 }
      },
      {
        id: "r1-d117",
        code: "D-117",
        name: "Mechanical Faculty Room 117",
        floor: 1,
        block: "D - Block",
        category: "faculty",
        capacity: 30,
        areaSqm: 240,
        facilities: ["Faculty Desks", "Discussion Cubicles", "LAN Ports"],
        description: "Department of Mechanical Engineering instructors and research scholars.",
        hotspot: { x: 38.3, y: 12.5, width: 8, height: 9 }
      },
      {
        id: "r1-d118",
        code: "D-118",
        name: "Fluid Mechanics & Machinery Lab 118",
        floor: 1,
        block: "D - Block",
        category: "lab",
        capacity: 55,
        areaSqm: 240,
        facilities: ["Wind Tunnel", "Pelton Wheel & Francis Turbine", "Flow Meters"],
        description: "Fluid dynamics, flow measurement, and hydraulic turbomachinery lab.",
        hotspot: { x: 48.4, y: 11.0, width: 9, height: 9 }
      },
      {
        id: "r1-d119",
        code: "D-119",
        name: "Heat & Mass Transfer Lab 119",
        floor: 1,
        block: "D - Block",
        category: "lab",
        capacity: 50,
        areaSqm: 240,
        facilities: ["Thermal Conductivity Apparatus", "Heat Exchanger Rig"],
        description: "Thermal engineering lab focusing on conduction, convection, and radiation.",
        hotspot: { x: 58.1, y: 10.0, width: 8, height: 9 }
      },
      {
        id: "r1-d120",
        code: "D-120",
        name: "CNMS Lab / Store 120",
        floor: 1,
        block: "D - Block",
        category: "lab",
        capacity: 40,
        areaSqm: 450,
        facilities: ["Chemical Vault", "Fume Hoods", "High-purity Nitrogen"],
        description: "Center for Nano and Material Sciences precursor materials repository.",
        hotspot: { x: 75.5, y: 17.5, width: 12, height: 12 }
      },
      {
        id: "r1-c121",
        code: "C-121",
        name: "Material Testing Lab 121",
        floor: 1,
        block: "C - Block",
        category: "lab",
        capacity: 50,
        areaSqm: 240,
        facilities: ["Universal Testing Machine (UTM)", "Torsion Tester", "Hardness Testers"],
        description: "Materials characterization measuring tensile, compressive, and fatigue strength.",
        hotspot: { x: 83.8, y: 35.5, width: 12, height: 7 }
      },
      {
        id: "r1-c122",
        code: "C-122",
        name: "Machine Shop 122",
        floor: 1,
        block: "C - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["CNC Lathes", "Milling Machines", "Drilling Stations", "Grinders"],
        description: "Industrial-grade manufacturing shop for precision machining and fabrication.",
        hotspot: { x: 82.0, y: 44.0, width: 12, height: 7 }
      },
      {
        id: "r1-c123",
        code: "C-123",
        name: "Relay & High Voltage Lab 123",
        floor: 1,
        block: "C - Block",
        category: "lab",
        capacity: 50,
        areaSqm: 240,
        facilities: ["High Voltage Test Transformer", "Relay Test Bench", "Insulation Tester"],
        description: "High voltage electrical engineering and power system protection lab.",
        hotspot: { x: 80.0, y: 53.0, width: 12, height: 7 }
      },
      {
        id: "r1-b110",
        code: "B-110",
        name: "Lecture Hall 110",
        floor: 1,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Podium", "AC", "Full HD Projection"],
        description: "Lecture theatre for computing science classes.",
        hotspot: { x: 59.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r1-b111",
        code: "B-111",
        name: "Lecture Hall 111",
        floor: 1,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "Tiered Seating", "AC"],
        description: "Lecture room for software engineering classes.",
        hotspot: { x: 47.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r1-b112",
        code: "B-112",
        name: "Lecture Hall 112",
        floor: 1,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Interactive Display", "Audio System", "AC"],
        description: "Assigned for algorithms and mathematical modeling.",
        hotspot: { x: 38.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r1-b124",
        code: "B-124",
        name: "Computer Science Project Lab 124",
        floor: 1,
        block: "B - Block",
        category: "lab",
        capacity: 70,
        areaSqm: 240,
        facilities: ["70 Workstations", "High-speed Fiber", "Ubuntu Linux", "Dual Displays"],
        description: "Final year engineering capstone projects and research incubator.",
        hotspot: { x: 59.5, y: 75.0, width: 8, height: 9 }
      },
      {
        id: "r1-b125a",
        code: "B-125-A",
        name: "Computer Lab 125-A",
        floor: 1,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Dell OptiPlex Desktops", "Python / C++ Toolchains", "LAN"],
        description: "Programming laboratory for sophomore data structures and OOP.",
        hotspot: { x: 50.0, y: 72.0, width: 8, height: 6 }
      },
      {
        id: "r1-b125b",
        code: "B-125-B",
        name: "Computer Lab 125-B",
        floor: 1,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Ubuntu Linux", "VS Code", "PostgreSQL", "Gigabit Switch"],
        description: "Database management and web development computing laboratory.",
        hotspot: { x: 50.0, y: 81.0, width: 8, height: 6 }
      },
      {
        id: "r1-b126a",
        code: "B-126-A",
        name: "Computer Lab 126-A",
        floor: 1,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Workstations", "Cloud Connectors", "Wi-Fi 6"],
        description: "Operating systems and computer networks simulation lab.",
        hotspot: { x: 40.5, y: 74.5, width: 8, height: 6 }
      },
      {
        id: "r1-b126b",
        code: "B-126-B",
        name: "Computer Lab 126-B",
        floor: 1,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Workstations", "Compiler Tools", "Interactive Screen"],
        description: "Compiler design and systems programming laboratory.",
        hotspot: { x: 40.5, y: 83.5, width: 8, height: 6 }
      },
      {
        id: "r1-b127a",
        code: "B-127-A",
        name: "Lecture Hall 127-A",
        floor: 1,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "AC", "Full HD Projection"],
        description: "Scheduled for computer science core lectures.",
        hotspot: { x: 30.5, y: 72.0, width: 7, height: 4 }
      },
      {
        id: "r1-b127b",
        code: "B-127-B",
        name: "Lecture Hall 127-B",
        floor: 1,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Screen", "Tiered Desks", "AC"],
        description: "Dedicated to information science and software engineering.",
        hotspot: { x: 30.5, y: 76.5, width: 7, height: 4 }
      },
      {
        id: "r1-b127c",
        code: "B-127-C",
        name: "Lecture Hall 127-C",
        floor: 1,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Full HD Projector", "Sound System"],
        description: "Classroom for theoretical computing and formal languages.",
        hotspot: { x: 30.5, y: 81.5, width: 7, height: 4 }
      }
    ]
  },

  // ==========================================
  // SECOND FLOOR (LEVEL 2)
  // ==========================================
  {
    floorNumber: 2,
    levelTitle: "Floor 2 (Level 2)",
    shortName: "2nd Floor",
    subtitle: "JU School of Engineering & Technology · CSE Core (A-204), CET Wing, Central Library & Workshops",
    cadImage: "/floorPlan/Floor-2.png",
    totalAreaSqm: 4700,
    totalRooms: 26,
    highlights: [
      "Room A-204 (Official CSE Core Timetable Lecture Room)",
      "Computer Science HOD Suite 226 & EC Faculty Room 227",
      "Computer Lab 224, CAD/CAM Lab 225 & Makers Lab 209",
      "Central Digital Library 220 (930 SQM) & Research Lab CET 217"
    ],
    rooms: [
      {
        id: "r2-a201",
        code: "A-201",
        name: "Lecture Hall 201",
        floor: 2,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "Projection", "AC"],
        description: "Lecture room for core engineering classes.",
        hotspot: { x: 28.5, y: 51.5, width: 7, height: 4 }
      },
      {
        id: "r2-a202",
        code: "A-202",
        name: "Lecture Hall 202",
        floor: 2,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Podium", "Dual Full HD Projectors"],
        description: "Assigned for core computing and discrete structures.",
        hotspot: { x: 28.5, y: 42.0, width: 7, height: 4 }
      },
      {
        id: "r2-a203",
        code: "A-203",
        name: "Lecture Hall 203",
        floor: 2,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Wireless Projection", "Surround Sound", "AC"],
        description: "Scheduled for Computer Architecture and OS sessions.",
        hotspot: { x: 29.5, y: 30.5, width: 7, height: 4 }
      },
      {
        id: "r2-d204",
        code: "A-204",
        name: "CSE Core Lecture Theatre A-204",
        floor: 2,
        block: "D - Block",
        category: "lecture",
        capacity: 75,
        areaSqm: 65,
        facilities: ["Smart Board 86-inch", "Lecture Recording Rig", "Gigabit Ethernet"],
        description: "The primary lecture room featured in the institutional timetable for Discrete Maths, OS, and Data Structures.",
        hotspot: { x: 36.6, y: 23.0, width: 6, height: 5 }
      },
      {
        id: "r2-d205",
        code: "A-205",
        name: "Lecture Hall 205",
        floor: 2,
        block: "D - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Ultra HD Display", "Acoustic Insulation"],
        description: "Dedicated to Software Engineering and Database Systems.",
        hotspot: { x: 47.6, y: 21.5, width: 5, height: 5 }
      },
      {
        id: "r2-d206",
        code: "A-206",
        name: "Lecture Hall 206",
        floor: 2,
        block: "D - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Interactive Whiteboard", "Mic Amplifier", "AC"],
        description: "Scheduled for Information Security and Cloud Computing.",
        hotspot: { x: 57.6, y: 21.5, width: 5, height: 5 }
      },
      {
        id: "r2-b207",
        code: "B-207",
        name: "Lecture Hall 207",
        floor: 2,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Laser Projection", "Sound Paneling", "Wi-Fi 6"],
        description: "Assigned for Electronics, Signal Systems, and Communication networks.",
        hotspot: { x: 65.7, y: 30.5, width: 6, height: 4 }
      },
      {
        id: "r2-b208",
        code: "B-208",
        name: "Lecture Hall 208",
        floor: 2,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Interactive Display", "Ceiling Speakers"],
        description: "Dedicated lecture hall for Civil and Mechanical classes.",
        hotspot: { x: 65.7, y: 40.0, width: 6, height: 4 }
      },
      {
        id: "r2-b209",
        code: "B-209",
        name: "Makers Lab 209",
        floor: 2,
        block: "B - Block",
        category: "lab",
        capacity: 45,
        areaSqm: 55,
        facilities: ["3D Printers", "Laser Cutters", "IoT Prototyping Kits", "Soldering Benches"],
        description: "Open prototyping and makerspace for student robotics and innovations.",
        hotspot: { x: 63.5, y: 51.5, width: 6, height: 4 }
      },
      {
        id: "r2-a210",
        code: "A-210",
        name: "Lecture Hall 210",
        floor: 2,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Podium", "AC"],
        description: "Assigned for computer science electives.",
        hotspot: { x: 57.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r2-a211",
        code: "A-211",
        name: "Lecture Hall 211",
        floor: 2,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Screen", "Tiered Seating"],
        description: "Assigned for artificial intelligence theory.",
        hotspot: { x: 46.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r2-a212",
        code: "A-212",
        name: "Lecture Hall 212",
        floor: 2,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Full HD Projector", "Audio System"],
        description: "Assigned for machine learning foundations.",
        hotspot: { x: 37.0, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r2-a213",
        code: "A-213",
        name: "Electronics & Comm HOD & Faculty 213",
        floor: 2,
        block: "A - Block",
        category: "faculty",
        capacity: 30,
        areaSqm: 95,
        facilities: ["HOD Chamber", "Faculty Cubicles", "Meeting Suite"],
        description: "Departmental headquarters for Electronics & Communication Engineering.",
        hotspot: { x: 16.0, y: 57.5, width: 10, height: 7 }
      },
      {
        id: "r2-a214",
        code: "A-214",
        name: "Electronics HDL / DSP Lab 214",
        floor: 2,
        block: "A - Block",
        category: "lab",
        capacity: 55,
        areaSqm: 240,
        facilities: ["DSP Processors", "FPGA Starter Kits", "Simulink Terminals"],
        description: "Hardware description language simulation and DSP algorithm implementation.",
        hotspot: { x: 12.0, y: 48.0, width: 12, height: 6 }
      },
      {
        id: "r2-a215",
        code: "A-215",
        name: "Advance Microcontroller & Microprocessor Lab 215",
        floor: 2,
        block: "A - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["ARM Cortex Rigs", "ESP32 Kits", "Oscilloscopes"],
        description: "Hands-on engineering lab for embedded systems and microcontrollers.",
        hotspot: { x: 14.5, y: 39.5, width: 12, height: 6 }
      },
      {
        id: "r2-a216",
        code: "A-216",
        name: "Electronics Project / Research Lab 216",
        floor: 2,
        block: "A - Block",
        category: "lab",
        capacity: 55,
        areaSqm: 240,
        facilities: ["Prototyping Benches", "3D Printers", "SMD Rework", "Spectrum Analyzers"],
        description: "Capstone development and faculty research lab for senior electronics designs.",
        hotspot: { x: 16.5, y: 30.0, width: 12, height: 6 }
      },
      {
        id: "r2-d217",
        code: "D-217",
        name: "Research Lab CET (Center for Emerging Tech)",
        floor: 2,
        block: "D - Block",
        category: "lab",
        capacity: 45,
        areaSqm: 240,
        facilities: ["NVIDIA RTX 4090 Workstations", "Quantum Simulators", "High-speed Fiber"],
        description: "Specialized research facility for blockchain, federated learning, and cyber physical systems.",
        hotspot: { x: 36.6, y: 10.5, width: 8, height: 9 }
      },
      {
        id: "r2-d216",
        code: "D-216",
        name: "EEE HOD & Faculty Room 216",
        floor: 2,
        block: "D - Block",
        category: "faculty",
        capacity: 25,
        areaSqm: 95,
        facilities: ["HOD Chamber", "Faculty Workstations", "Departmental Library"],
        description: "Faculty room for the Department of Electrical & Electronics Engineering.",
        hotspot: { x: 46.2, y: 8.5, width: 9, height: 9 }
      },
      {
        id: "r2-d219",
        code: "D-219",
        name: "Electrical Lab 219",
        floor: 2,
        block: "D - Block",
        category: "lab",
        capacity: 55,
        areaSqm: 240,
        facilities: ["Transformers & Motors", "Load Banks", "Synchronous Machines"],
        description: "Laboratory for electric machines, high-voltage experiments, and power transmission.",
        hotspot: { x: 55.8, y: 8.0, width: 8, height: 9 }
      },
      {
        id: "r2-d220",
        code: "D-220",
        name: "Central Digital Library 220",
        floor: 2,
        block: "D - Block",
        category: "amenity",
        capacity: 250,
        areaSqm: 930,
        facilities: ["50 E-Reader Terminals", "IEEE Xplore & ACM Portal Access", "Silent Study Pods"],
        description: "Expansive university library with digital repository, journals, and private study carrels.",
        hotspot: { x: 73.5, y: 15.0, width: 13, height: 12 }
      },
      {
        id: "r2-b221",
        code: "B-221",
        name: "Civil CAD Lab 221",
        floor: 2,
        block: "B - Block",
        category: "lab",
        capacity: 50,
        areaSqm: 240,
        facilities: ["AutoCAD 2026", "Revit & STAAD.Pro", "High-res Large Format Plotters"],
        description: "Advanced simulation lab for architectural drafting, BIM, and structural analysis.",
        hotspot: { x: 81.0, y: 32.5, width: 12, height: 6 }
      },
      {
        id: "r2-b222",
        code: "B-222",
        name: "Engineering Work Shop 222",
        floor: 2,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Fitting & Carpentry Workbenches", "Sheet Metal Tools", "Welding Booths"],
        description: "Fundamental engineering practices workshop for metalworking and fabrication.",
        hotspot: { x: 79.0, y: 41.5, width: 12, height: 6 }
      },
      {
        id: "r2-b223",
        code: "B-223",
        name: "Coating Lab 223",
        floor: 2,
        block: "B - Block",
        category: "lab",
        capacity: 40,
        areaSqm: 240,
        facilities: ["Spin Coaters", "Dip Coating Units", "Surface Profilometer"],
        description: "Nanotechnology and metallurgical lab for thin film coatings and surface treatment.",
        hotspot: { x: 76.5, y: 50.5, width: 12, height: 6 }
      },
      {
        id: "r2-b224",
        code: "B-224",
        name: "Computer Lab 224",
        floor: 2,
        block: "B - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["High-speed PCs", "Ubuntu Linux", "Dual Monitors", "Gigabit LAN"],
        description: "Advanced software engineering and algorithms evaluation laboratory.",
        hotspot: { x: 57.0, y: 73.0, width: 8, height: 8 }
      },
      {
        id: "r2-b225",
        code: "B-225",
        name: "CAD/CAM Lab 225",
        floor: 2,
        block: "B - Block",
        category: "lab",
        capacity: 55,
        areaSqm: 240,
        facilities: ["SolidWorks", "CATIA", "CNC Simulation Rigs"],
        description: "Computer-aided design and computer-aided manufacturing engineering laboratory.",
        hotspot: { x: 48.0, y: 74.5, width: 8, height: 8 }
      },
      {
        id: "r2-b226",
        code: "B-226",
        name: "Computer Science HOD & Faculty Room 226",
        floor: 2,
        block: "B - Block",
        category: "faculty",
        capacity: 35,
        areaSqm: 95,
        facilities: ["HOD Executive Chamber", "Faculty Workstations", "Meeting Lounge"],
        description: "Official executive office of HOD CSE and senior departmental professors.",
        hotspot: { x: 39.0, y: 75.5, width: 8, height: 8 }
      },
      {
        id: "r2-a227",
        code: "A-227",
        name: "EC Faculty Room 227",
        floor: 2,
        block: "A - Block",
        category: "faculty",
        capacity: 30,
        areaSqm: 95,
        facilities: ["Faculty Workstations", "Discussion Tables"],
        description: "Faculty workstation hall for Electronics & Communication Engineering.",
        hotspot: { x: 30.0, y: 73.5, width: 8, height: 8 }
      }
    ]
  },

  // ==========================================
  // THIRD FLOOR (LEVEL 3)
  // ==========================================
  {
    floorNumber: 3,
    levelTitle: "Floor 3 (Level 3)",
    shortName: "3rd Floor",
    subtitle: "JU School of Engineering & Technology · AI Programming Lab 316, Examination Section & IT Wing",
    cadImage: "/floorPlan/Floor-3.png",
    totalAreaSqm: 4650,
    totalRooms: 26,
    highlights: [
      "AI Programming Lab 316 (LAB-2 - 70 All-in-One Ubuntu Dev Nodes)",
      "Examination Sections (313, 327) & Valuation Room 314",
      "Network Database Lab 324-A & Web Technology Lab 324-B",
      "Information Science HOD & Faculty 325 & NAVIC IRNS Lab 326"
    ],
    rooms: [
      {
        id: "r3-a301",
        code: "A-301",
        name: "Lecture Hall 301",
        floor: 3,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "AC"],
        description: "Lecture room for theoretical computing classes.",
        hotspot: { x: 28.5, y: 53.0, width: 7, height: 4 }
      },
      {
        id: "r3-a302",
        code: "A-302",
        name: "Lecture Hall 302",
        floor: 3,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "Audio Amplifiers", "Tiered Seating", "AC"],
        description: "Lecture hall dedicated to Data Science and Statistical Modeling.",
        hotspot: { x: 28.5, y: 43.5, width: 7, height: 4 }
      },
      {
        id: "r3-a303",
        code: "A-303",
        name: "Lecture Hall 303",
        floor: 3,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Interactive Screen", "Ceiling Mic System", "AC"],
        description: "Scheduled for Artificial Intelligence and Neural Networks theory classes.",
        hotspot: { x: 30.0, y: 32.5, width: 7, height: 4 }
      },
      {
        id: "r3-d304",
        code: "D-304",
        name: "Lecture Hall 304",
        floor: 3,
        block: "D - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Laser Projector", "Acoustic Insulation", "Wi-Fi"],
        description: "Scheduled for Computer Networks and Cloud Architecture.",
        hotspot: { x: 37.0, y: 24.5, width: 5, height: 5 }
      },
      {
        id: "r3-d305",
        code: "D-305",
        name: "Lecture Hall 305",
        floor: 3,
        block: "D - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "AC", "Ergonomic Chairs"],
        description: "Assigned for Cyber Security and Cryptography lectures.",
        hotspot: { x: 48.5, y: 23.5, width: 5, height: 5 }
      },
      {
        id: "r3-d306",
        code: "D-306",
        name: "Lecture Hall 306",
        floor: 3,
        block: "D - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["HD Projector", "Whiteboard", "Surround Speakers"],
        description: "Assigned for Big Data Analytics and Database Systems.",
        hotspot: { x: 58.5, y: 23.5, width: 5, height: 5 }
      },
      {
        id: "r3-b307",
        code: "B-307",
        name: "Lecture Hall 307",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Laser Screen", "Wireless Audio Podiums", "AC"],
        description: "Scheduled for Computer Vision and Natural Language Processing.",
        hotspot: { x: 67.0, y: 32.0, width: 6, height: 4 }
      },
      {
        id: "r3-b308",
        code: "B-308",
        name: "Lecture Hall 308",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "Full AC", "Step Seating"],
        description: "Classroom for Software Project Management and Agile Practices.",
        hotspot: { x: 66.5, y: 41.0, width: 6, height: 4 }
      },
      {
        id: "r3-b309",
        code: "B-309",
        name: "Lecture Hall 309",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Interactive Screen", "Whiteboard"],
        description: "Assigned for distributed computing lectures.",
        hotspot: { x: 65.5, y: 53.0, width: 6, height: 4 }
      },
      {
        id: "r3-c310",
        code: "C-310",
        name: "Lecture Hall 310",
        floor: 3,
        block: "C - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Podium", "AC"],
        description: "Elective classroom for high-performance computing.",
        hotspot: { x: 57.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r3-c311",
        code: "C-311",
        name: "Lecture Hall 311",
        floor: 3,
        block: "C - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "Tiered Desks"],
        description: "Assigned for advanced software architecture.",
        hotspot: { x: 46.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r3-c312",
        code: "C-312",
        name: "Lecture Hall 312",
        floor: 3,
        block: "C - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["HD Projector", "Audio System"],
        description: "Assigned for network security lectures.",
        hotspot: { x: 36.5, y: 62.0, width: 5, height: 5 }
      },
      {
        id: "r3-a313",
        code: "A-313",
        name: "Examination Section 313",
        floor: 3,
        block: "A - Block",
        category: "admin",
        capacity: 40,
        areaSqm: 180,
        facilities: ["Secure Vault", "Question Paper Terminal", "Biometric Access"],
        description: "University controller of examinations branch office.",
        hotspot: { x: 15.5, y: 60.5, width: 11, height: 6 }
      },
      {
        id: "r3-a314",
        code: "A-314",
        name: "Valuation Room 314",
        floor: 3,
        block: "A - Block",
        category: "admin",
        capacity: 40,
        areaSqm: 120,
        facilities: ["Evaluation Tables", "Barcode Scanners", "CCTV"],
        description: "Centralized evaluation and exam script valuation hall.",
        hotspot: { x: 14.0, y: 51.5, width: 11, height: 6 }
      },
      {
        id: "r3-a315",
        code: "A-315",
        name: "Campus Gymnasium 315",
        floor: 3,
        block: "A - Block",
        category: "amenity",
        capacity: 45,
        areaSqm: 180,
        facilities: ["Cardio Equipment", "Free Weights", "Locker Room"],
        description: "Student fitness and recreation facility.",
        hotspot: { x: 14.5, y: 42.0, width: 12, height: 6 }
      },
      {
        id: "r3-a316",
        code: "A-316",
        name: "Programming Lab 316 (LAB-2)",
        floor: 3,
        block: "A - Block",
        category: "lab",
        capacity: 70,
        areaSqm: 240,
        facilities: ["70 Ubuntu Dev Nodes", "Dual 4K Displays", "Gigabit LAN", "Local LLM"],
        description: "The primary computer lab for Networks Lab, Python/C++ Programming, and AI model evaluation.",
        hotspot: { x: 16.5, y: 32.5, width: 12, height: 6 }
      },
      {
        id: "r3-d317",
        code: "D-317",
        name: "Civil HOD & Faculty Room 317",
        floor: 3,
        block: "D - Block",
        category: "faculty",
        capacity: 25,
        areaSqm: 120,
        facilities: ["HOD Chamber", "Faculty Desks", "Conference Table"],
        description: "Departmental office for the Department of Civil Engineering.",
        hotspot: { x: 37.5, y: 11.5, width: 8, height: 9 }
      },
      {
        id: "r3-d318",
        code: "D-318",
        name: "Library Store 318",
        floor: 3,
        block: "D - Block",
        category: "amenity",
        capacity: 20,
        areaSqm: 55,
        facilities: ["Cataloging Desks", "Archival Shelves"],
        description: "Book acquisition, archiving, and cataloging repository.",
        hotspot: { x: 46.5, y: 9.5, width: 9, height: 9 }
      },
      {
        id: "r3-d319",
        code: "D-319",
        name: "Instrumentation Lab 319",
        floor: 3,
        block: "D - Block",
        category: "lab",
        capacity: 50,
        areaSqm: 240,
        facilities: ["Calibration Standards", "Pressure & Temp Sensors", "DSO Analyzers"],
        description: "Laboratory for process instrumentation and smart sensor integration.",
        hotspot: { x: 56.5, y: 9.0, width: 8, height: 9 }
      },
      {
        id: "r3-d320",
        code: "D-320",
        name: "Central Library Stack Room 320",
        floor: 3,
        block: "D - Block",
        category: "amenity",
        capacity: 100,
        areaSqm: 220,
        facilities: ["25,000+ Hardcover Volumes", "Reading Carrels", "Automated Kiosks"],
        description: "Main floor repository for research journals, encyclopedias, and dissertations.",
        hotspot: { x: 74.0, y: 16.5, width: 12, height: 12 }
      },
      {
        id: "r3-b321a",
        code: "B-321-A",
        name: "Lecture Hall 321-A",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 60,
        areaSqm: 65,
        facilities: ["Interactive Display", "Acoustic Walls"],
        description: "Assigned for advanced algorithms and computational geometry.",
        hotspot: { x: 81.5, y: 32.0, width: 9, height: 4 }
      },
      {
        id: "r3-b321b",
        code: "B-321-B",
        name: "Lecture Hall 321-B",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 60,
        areaSqm: 65,
        facilities: ["Laser Projector", "Smart Podium", "AC"],
        description: "Assigned for parallel computing and high-performance algorithms.",
        hotspot: { x: 81.5, y: 36.5, width: 9, height: 4 }
      },
      {
        id: "r3-b322a",
        code: "B-322-A",
        name: "Lecture Hall 322-A",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 45,
        areaSqm: 65,
        facilities: ["Smart Screen", "Whiteboard", "AC"],
        description: "Tutorial and elective classroom for finite element methods.",
        hotspot: { x: 76.5, y: 43.0, width: 4, height: 6 }
      },
      {
        id: "r3-b322b",
        code: "B-322-B",
        name: "Lecture Hall 322-B",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 60,
        areaSqm: 65,
        facilities: ["Full HD Display", "Ergonomic Chairs"],
        description: "Assigned for environmental engineering and structural dynamics.",
        hotspot: { x: 84.5, y: 40.5, width: 9, height: 4 }
      },
      {
        id: "r3-b322c",
        code: "B-322-C",
        name: "Lecture Hall 322-C",
        floor: 3,
        block: "B - Block",
        category: "lecture",
        capacity: 60,
        areaSqm: 65,
        facilities: ["Smart Podium", "Acoustic Paneling", "Wi-Fi"],
        description: "Assigned for geotechnical and foundation studies.",
        hotspot: { x: 84.5, y: 45.0, width: 9, height: 4 }
      },
      {
        id: "r3-b323",
        code: "B-323",
        name: "Basic Science HOD & Faculty Room 323",
        floor: 3,
        block: "B - Block",
        category: "faculty",
        capacity: 40,
        areaSqm: 240,
        facilities: ["HOD Office", "Faculty Workstations", "Meeting Lounge"],
        description: "Faculty suites for the Department of Mathematics and Basic Sciences.",
        hotspot: { x: 79.0, y: 52.5, width: 12, height: 6 }
      },
      {
        id: "r3-c324a",
        code: "C-324-A",
        name: "Network Database Lab 324-A",
        floor: 3,
        block: "C - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Database Servers", "Oracle / MongoDB", "High-speed Switch"],
        description: "Specialized lab for distributed databases and query optimization.",
        hotspot: { x: 57.0, y: 72.0, width: 8, height: 5 }
      },
      {
        id: "r3-c324b",
        code: "C-324-B",
        name: "Web Technology Lab 324-B",
        floor: 3,
        block: "C - Block",
        category: "lab",
        capacity: 60,
        areaSqm: 240,
        facilities: ["Full-Stack Dev Rigs", "Node.js / React / Docker", "Cloud Connect"],
        description: "Web development, microservices, and API prototyping laboratory.",
        hotspot: { x: 57.0, y: 78.5, width: 8, height: 5 }
      },
      {
        id: "r3-c325",
        code: "C-325",
        name: "Information Science HOD & Faculty Room 325",
        floor: 3,
        block: "C - Block",
        category: "faculty",
        capacity: 35,
        areaSqm: 240,
        facilities: ["HOD Chamber", "Faculty Desks", "Conference Table"],
        description: "Departmental headquarters for Information Science & Engineering.",
        hotspot: { x: 48.0, y: 75.5, width: 8, height: 8 }
      },
      {
        id: "r3-c326",
        code: "C-326",
        name: "NAVIC IRNS Research Lab 326",
        floor: 3,
        block: "C - Block",
        category: "lab",
        capacity: 40,
        areaSqm: 180,
        facilities: ["Satellite Signal Receivers", "Spectrum Analyzers", "GPS/NavIC Simulators"],
        description: "Indian Regional Navigation Satellite System (NavIC) research and telemetry laboratory.",
        hotspot: { x: 39.0, y: 76.5, width: 8, height: 8 }
      },
      {
        id: "r3-c327",
        code: "C-327",
        name: "Examination Section 327",
        floor: 3,
        block: "C - Block",
        category: "admin",
        capacity: 30,
        areaSqm: 180,
        facilities: ["Secure Printing Terminal", "Paper Shredders", "Document Vault"],
        description: "Confidential examination paper management and evaluation archives.",
        hotspot: { x: 29.5, y: 76.5, width: 8, height: 8 }
      }
    ]
  },

  // ==========================================
  // FOURTH FLOOR (LEVEL 4)
  // ==========================================
  {
    floorNumber: 4,
    levelTitle: "Floor 4 (Level 4)",
    shortName: "4th Floor",
    subtitle: "JU School of Engineering & Technology · CNMS Nanotechnology Wing & Life Sciences Laboratories",
    cadImage: "/floorPlan/Floor-4.png",
    totalAreaSqm: 4600,
    totalRooms: 30,
    highlights: [
      "Center for Nano & Material Sciences (CNMS) Clean Laboratories (413-428)",
      "Food Technology & Microbiology Labs (434-437)",
      "Sustainable Energy & Carbonic Chemistry Labs (429, 430)",
      "Doctoral Studies Coordination Cell (430) & Wing Director (429)"
    ],
    rooms: [
      {
        id: "r4-a401",
        code: "A-401",
        name: "CNMS Board Room 401",
        floor: 4,
        block: "A - Block",
        category: "admin",
        capacity: 25,
        areaSqm: 65,
        facilities: ["Board Table", "Video Conference System", "Acoustic Walls"],
        description: "Executive meeting room for Center for Nano and Material Sciences directors.",
        hotspot: { x: 27.5, y: 54.0, width: 6, height: 4 }
      },
      {
        id: "r4-a402",
        code: "A-402",
        name: "CNMS Office 402",
        floor: 4,
        block: "A - Block",
        category: "admin",
        capacity: 20,
        areaSqm: 55,
        facilities: ["Research Coordination Desks", "Grant Archives"],
        description: "Administrative headquarters for sponsored nanotechnology projects and fellowships.",
        hotspot: { x: 27.5, y: 44.0, width: 6, height: 4 }
      },
      {
        id: "r4-a403",
        code: "A-403",
        name: "Lecture Hall 403",
        floor: 4,
        block: "A - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Dual Displays", "Video Conference Rig", "Tiered Seating"],
        description: "Used for PhD viva voce defenses and advanced seminars.",
        hotspot: { x: 29.0, y: 32.0, width: 6, height: 4 }
      },
      {
        id: "r4-a413",
        code: "A-413",
        name: "CNMS Lab 413",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 65,
        facilities: ["Fume Hoods", "High-precision Balances"],
        description: "Material synthesis and sample preparation clean room.",
        hotspot: { x: 15.5, y: 63.5, width: 10, height: 4 }
      },
      {
        id: "r4-a414",
        code: "A-414",
        name: "Dairy Technology Lab 414",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 40,
        areaSqm: 180,
        facilities: ["Pasteurizers", "Homogenizers", "Analytical Testing Kits"],
        description: "Dairy processing, quality verification, and food biochemistry lab.",
        hotspot: { x: 15.5, y: 59.0, width: 10, height: 4 }
      },
      {
        id: "r4-a415",
        code: "A-415",
        name: "Oregano Metallic Lab 415",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["Gloveboxes", "Schlenk Lines", "Inert Gas Purifiers"],
        description: "Organometallic chemistry and catalyst synthesis laboratory.",
        hotspot: { x: 13.0, y: 54.0, width: 10, height: 4 }
      },
      {
        id: "r4-a416",
        code: "A-416",
        name: "CNMS Lab 416",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 65,
        facilities: ["Chemical Fume Hoods", "Autoclaves"],
        description: "Nanomaterial synthesis and chemical functionalization research.",
        hotspot: { x: 13.0, y: 49.0, width: 10, height: 4 }
      },
      {
        id: "r4-a417",
        code: "A-417",
        name: "CNMS Lab 417",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 65,
        facilities: ["Muffle Furnaces", "Ultrasonic Sonicators"],
        description: "Sol-gel and hydrothermal synthesis of functional materials.",
        hotspot: { x: 13.0, y: 44.0, width: 10, height: 4 }
      },
      {
        id: "r4-a418",
        code: "A-418",
        name: "CNMS Lab 418",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 65,
        facilities: ["X-ray Diffraction (XRD)", "TEM Sample Prep"],
        description: "Nanomaterials crystallographic analysis laboratory.",
        hotspot: { x: 13.0, y: 39.5, width: 10, height: 4 }
      },
      {
        id: "r4-a419",
        code: "A-419",
        name: "Membrane Lab 419",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 30,
        areaSqm: 120,
        facilities: ["Permeability Analyzers", "Desalination Cells"],
        description: "Advanced environmental lab developing selective filtration membranes.",
        hotspot: { x: 16.0, y: 34.5, width: 11, height: 4 }
      },
      {
        id: "r4-a420",
        code: "A-420",
        name: "Pathogens Lab 420",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 30,
        areaSqm: 120,
        facilities: ["Biosafety Level-2 Cabinets", "CO2 Incubators", "Fluorescence Microscope"],
        description: "Biomedical research facility examining antimicrobial surfaces.",
        hotspot: { x: 16.0, y: 29.5, width: 11, height: 4 }
      },
      {
        id: "r4-a421",
        code: "A-421",
        name: "Nano Catalysis Lab 421",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 30,
        areaSqm: 65,
        facilities: ["Solar Simulators", "Gas Chromatographs"],
        description: "Renewable energy lab working on green hydrogen and solar light conversion.",
        hotspot: { x: 33.6, y: 12.0, width: 5, height: 8 }
      },
      {
        id: "r4-a422",
        code: "A-422",
        name: "Drug Molecules Lab 422",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 25,
        areaSqm: 65,
        facilities: ["HPLC Systems", "Lyophilizer", "Rotary Evaporators"],
        description: "Pharmaceutical synthesis lab developing novel anticancer formulations.",
        hotspot: { x: 38.0, y: 12.0, width: 5, height: 8 }
      },
      {
        id: "r4-a423",
        code: "A-423",
        name: "Photo & Electro Catalysis Lab 423",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 65,
        facilities: ["Potentiostat", "Photocatalytic Reactors"],
        description: "Interfacial electron transfer and redox catalyst development.",
        hotspot: { x: 44.3, y: 10.0, width: 7, height: 8 }
      },
      {
        id: "r4-a424",
        code: "A-424",
        name: "Oregano Electronics Lab 424",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 30,
        areaSqm: 65,
        facilities: ["OLED Glovebox", "Parameter Analyzer"],
        description: "Flexible organic semiconductors and printable electronics.",
        hotspot: { x: 52.1, y: 9.5, width: 7, height: 8 }
      },
      {
        id: "r4-a425",
        code: "A-425",
        name: "Organic Chemistry Lab 425",
        floor: 4,
        block: "A - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 65,
        facilities: ["Fume Hoods", "Flash Chromatography"],
        description: "Complex molecule synthesis and catalytic transformations.",
        hotspot: { x: 59.5, y: 9.0, width: 7, height: 8 }
      },
      {
        id: "r4-a429",
        code: "A-429",
        name: "CNMS Wing Director Chamber 429",
        floor: 4,
        block: "A - Block",
        category: "admin",
        capacity: 15,
        areaSqm: 55,
        facilities: ["Director Chamber", "Conference Table"],
        description: "Executive chamber of the Center for Nano and Material Sciences Director.",
        hotspot: { x: 35.0, y: 24.5, width: 5, height: 5 }
      },
      {
        id: "r4-a430",
        code: "A-430",
        name: "PhD Co-ordinator Cell 430",
        floor: 4,
        block: "A - Block",
        category: "admin",
        capacity: 25,
        areaSqm: 55,
        facilities: ["Doctoral Committee Room", "Thesis Submission Desk"],
        description: "Coordination hub for university doctoral candidates and fellowships.",
        hotspot: { x: 46.5, y: 23.0, width: 5, height: 5 }
      },
      {
        id: "r4-a431",
        code: "A-431",
        name: "Civil HOD Office 431",
        floor: 4,
        block: "A - Block",
        category: "faculty",
        capacity: 15,
        areaSqm: 55,
        facilities: ["HOD Office", "Meeting Lounge"],
        description: "Executive chamber for Civil Engineering Department Head.",
        hotspot: { x: 58.5, y: 23.0, width: 5, height: 5 }
      },
      {
        id: "r4-b400",
        code: "B-400",
        name: "CNMS Faculty Room 400",
        floor: 4,
        block: "B - Block",
        category: "faculty",
        capacity: 30,
        areaSqm: 55,
        facilities: ["Faculty Desks", "Discussion Tables"],
        description: "Faculty workstation hall for resident CNMS scientists.",
        hotspot: { x: 65.5, y: 55.5, width: 6, height: 4 }
      },
      {
        id: "r4-b407",
        code: "B-407",
        name: "Lecture Hall 407",
        floor: 4,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Laser Projector", "Smart Interactive Podium"],
        description: "Scheduled for doctoral course work and advanced research seminars.",
        hotspot: { x: 67.0, y: 32.5, width: 6, height: 4 }
      },
      {
        id: "r4-b408",
        code: "B-408",
        name: "Lecture Hall 408",
        floor: 4,
        block: "B - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Screen", "Surround Mics"],
        description: "Lecture room for bio-nanotechnology theory.",
        hotspot: { x: 67.0, y: 42.0, width: 6, height: 4 }
      },
      {
        id: "r4-b426",
        code: "B-426",
        name: "Nano & Bio Interfaces Lab 426",
        floor: 4,
        block: "B - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["QCM Sensor", "Contact Angle Goniometer"],
        description: "Study of biomolecular interactions on nanostructured surfaces.",
        hotspot: { x: 81.2, y: 34.0, width: 12, height: 5 }
      },
      {
        id: "r4-b427",
        code: "B-427",
        name: "Organic & Inorganic Chemistry Lab 427",
        floor: 4,
        block: "B - Block",
        category: "lab",
        capacity: 40,
        areaSqm: 120,
        facilities: ["FTIR", "Thermal Gravimetric Analyzer"],
        description: "Joint organic and coordination chemistry facility.",
        hotspot: { x: 81.6, y: 40.0, width: 12, height: 5 }
      },
      {
        id: "r4-b428",
        code: "B-428",
        name: "Physical Chemistry Lab 428",
        floor: 4,
        block: "B - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["BET Surface Area Analyzer", "Zeta Potential"],
        description: "Precision measurement of porosity and colloidal stability.",
        hotspot: { x: 81.6, y: 45.5, width: 12, height: 5 }
      },
      {
        id: "r4-b429",
        code: "B-429",
        name: "Sustainable Energy Material Process 429",
        floor: 4,
        block: "B - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["Battery Cyclers", "Supercapacitor Benches"],
        description: "Energy storage and green material processing laboratory.",
        hotspot: { x: 78.5, y: 51.0, width: 12, height: 5 }
      },
      {
        id: "r4-b430",
        code: "B-430",
        name: "Carbonic Chemistry Lab 430",
        floor: 4,
        block: "B - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["Carbon Synthesis Reactors", "CVD Tubes"],
        description: "Carbon nanotube, graphene, and fullerene synthesis laboratory.",
        hotspot: { x: 76.5, y: 56.5, width: 12, height: 5 }
      },
      {
        id: "r4-c410",
        code: "C-410",
        name: "Lecture Hall 410",
        floor: 4,
        block: "C - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Smart Board", "AC"],
        description: "Scheduled for doctoral elective coursework.",
        hotspot: { x: 57.5, y: 64.0, width: 5, height: 5 }
      },
      {
        id: "r4-c411",
        code: "C-411",
        name: "Lecture Hall 411",
        floor: 4,
        block: "C - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Full HD Projector", "Audio System"],
        description: "Scheduled for computational biology lectures.",
        hotspot: { x: 45.5, y: 65.5, width: 5, height: 5 }
      },
      {
        id: "r4-c412",
        code: "C-412",
        name: "Lecture Hall 412",
        floor: 4,
        block: "C - Block",
        category: "lecture",
        capacity: 65,
        areaSqm: 65,
        facilities: ["Interactive Screen", "Whiteboard"],
        description: "Scheduled for environmental technology classes.",
        hotspot: { x: 36.5, y: 65.5, width: 5, height: 5 }
      },
      {
        id: "r4-c431",
        code: "C-431",
        name: "CNMS Faculty Room 431",
        floor: 4,
        block: "C - Block",
        category: "faculty",
        capacity: 25,
        areaSqm: 55,
        facilities: ["Faculty Desks", "Wi-Fi 6"],
        description: "Faculty workstation hall for senior researchers.",
        hotspot: { x: 58.5, y: 77.0, width: 5, height: 8 }
      },
      {
        id: "r4-c432",
        code: "C-432",
        name: "CNMS Faculty Room 432",
        floor: 4,
        block: "C - Block",
        category: "faculty",
        capacity: 25,
        areaSqm: 55,
        facilities: ["Faculty Desks", "Discussion Area"],
        description: "Faculty workstation hall for post-doctoral scientists.",
        hotspot: { x: 54.0, y: 77.0, width: 5, height: 8 }
      },
      {
        id: "r4-c433",
        code: "C-433",
        name: "CNMS Faculty Room 433",
        floor: 4,
        block: "C - Block",
        category: "faculty",
        capacity: 25,
        areaSqm: 55,
        facilities: ["Faculty Cubicles", "LAN Ports"],
        description: "Faculty workstation hall for research fellows.",
        hotspot: { x: 49.0, y: 77.0, width: 5, height: 8 }
      },
      {
        id: "r4-c434",
        code: "C-434",
        name: "Food Tech Staff Room 434",
        floor: 4,
        block: "C - Block",
        category: "faculty",
        capacity: 25,
        areaSqm: 65,
        facilities: ["Staff Desks", "Meeting Table"],
        description: "Departmental office for Food Technology professors.",
        hotspot: { x: 44.5, y: 77.0, width: 5, height: 8 }
      },
      {
        id: "r4-c435",
        code: "C-435",
        name: "Food Microbiology Lab 435",
        floor: 4,
        block: "C - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["Incubators", "Sterilizers", "Microscopes"],
        description: "Fermentation, pathogen testing, and food safety evaluation.",
        hotspot: { x: 38.0, y: 78.0, width: 7, height: 9 }
      },
      {
        id: "r4-c436",
        code: "C-436",
        name: "Vegetable Tech Lab 436",
        floor: 4,
        block: "C - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["Post-harvest Test Rigs", "Texture Analyzers"],
        description: "Vegetable processing, preservation, and shelf-life analysis.",
        hotspot: { x: 31.5, y: 76.5, width: 6, height: 8 }
      },
      {
        id: "r4-c437",
        code: "C-437",
        name: "Greenhouse Farming Lab 437",
        floor: 4,
        block: "C - Block",
        category: "lab",
        capacity: 35,
        areaSqm: 120,
        facilities: ["Hydroponics Trays", "Controlled Spectrum LED", "Climate Control"],
        description: "Precision farming, indoor cultivation, and automated hydroponic monitoring.",
        hotspot: { x: 26.5, y: 76.5, width: 6, height: 8 }
      }
    ]
  }
];

export const CATEGORY_CONFIG: Record<RoomCategory, { label: string; color: string; bg: string; border: string; icon: string }> = {
  lecture: { label: "Lecture Hall", color: "#33409a", bg: "#eef1fb", border: "#c2cbed", icon: "GraduationCap" },
  lab: { label: "Laboratory", color: "#c84232", bg: "#fdf0ee", border: "#f3c6c0", icon: "FlaskConical" },
  faculty: { label: "Faculty Cabin", color: "#af7e19", bg: "#fdf8ea", border: "#f3e1b6", icon: "Briefcase" },
  admin: { label: "Admin & Exec", color: "#252b67", bg: "#e9ebf6", border: "#bcc2e5", icon: "Shield" },
  amenity: { label: "Campus Amenity", color: "#2d7a6e", bg: "#edf7f5", border: "#bfe1dc", icon: "Compass" }
};

/**
 * Resolves any timetable room string (e.g. "214B [AC] Room", "126B Lab", "215B")
 * to its exact CAD BuildingRoom object and floor number in CAMPUS_FLOORS.
 */
export function findBuildingRoomByCodeOrName(rawRoom: string): { room: BuildingRoom; floorNumber: number } | null {
  if (!rawRoom) return null;
  const clean = rawRoom.toUpperCase().trim();

  // Extract room number digits (e.g. 214, 126, 116, 215, 212, 113, 002, 007, etc.)
  const numMatch = clean.match(/(?:ROOM|LAB|HALL|A-|B-|\b)?\s*([A-Z]?-?(\d{3})[A-Z]?)/i);
  const roomNum = numMatch ? numMatch[2] : "";
  const firstDigit = roomNum ? parseInt(roomNum[0], 10) : null;

  // 1. If 3-digit number found, search for rooms containing this number on matching floor
  if (roomNum) {
    for (const floor of CAMPUS_FLOORS) {
      for (const r of floor.rooms) {
        const rCodeClean = r.code.toUpperCase().replace(/[-\s]/g, "");
        if (rCodeClean.includes(roomNum) || r.id.toUpperCase().includes(roomNum) || r.name.toUpperCase().includes(roomNum)) {
          return { room: r, floorNumber: floor.floorNumber };
        }
      }
    }
  }

  // 2. Direct code or name match across all floors
  for (const floor of CAMPUS_FLOORS) {
    for (const r of floor.rooms) {
      const rCode = r.code.toUpperCase().replace(/[-\s]/g, "");
      const cleanNoDash = clean.replace(/[-\s]/g, "");
      if (
        cleanNoDash.includes(rCode) ||
        rCode.includes(cleanNoDash) ||
        clean.includes(r.name.toUpperCase()) ||
        r.name.toUpperCase().includes(clean)
      ) {
        return { room: r, floorNumber: floor.floorNumber };
      }
    }
  }

  // 3. Match common named campus areas (Seminar Hall, Amphitheatre, Labs, etc.)
  const areaKeywords = [
    { kw: "SEMINAR", code: "A-002" },
    { kw: "AMPHITHEATRE", code: "A-008" },
    { kw: "CHEMISTRY", code: "B-012" },
    { kw: "PHYSICS", code: "B-011" },
    { kw: "ADMIN", code: "A-001" },
    { kw: "VICE CHANCELLOR", code: "A-007" },
    { kw: "COMPUTING", code: "A-108" },
    { kw: "MICROPROCESSOR", code: "A-215" },
    { kw: "MICROCONTROLLER", code: "A-215" },
    { kw: "NETWORKS", code: "A-312" },
    { kw: "AI LAB", code: "A-404" },
    { kw: "ROBOTICS", code: "A-405" },
  ];

  for (const { kw, code } of areaKeywords) {
    if (clean.includes(kw)) {
      for (const floor of CAMPUS_FLOORS) {
        const found = floor.rooms.find((r) => r.code === code);
        if (found) return { room: found, floorNumber: floor.floorNumber };
      }
    }
  }

  // 4. Check for textual floor indicators (e.g., "2nd Floor", "Ground Floor")
  if (/2nd\s*Floor|Floor\s*2|Level\s*2/i.test(clean)) {
    const f2 = CAMPUS_FLOORS.find((f) => f.floorNumber === 2);
    if (f2 && f2.rooms.length > 0) return { room: f2.rooms[0], floorNumber: 2 };
  }
  if (/1st\s*Floor|Floor\s*1|Level\s*1/i.test(clean)) {
    const f1 = CAMPUS_FLOORS.find((f) => f.floorNumber === 1);
    if (f1 && f1.rooms.length > 0) return { room: f1.rooms[0], floorNumber: 1 };
  }
  if (/3rd\s*Floor|Floor\s*3|Level\s*3/i.test(clean)) {
    const f3 = CAMPUS_FLOORS.find((f) => f.floorNumber === 3);
    if (f3 && f3.rooms.length > 0) return { room: f3.rooms[0], floorNumber: 3 };
  }
  if (/4th\s*Floor|Floor\s*4|Level\s*4/i.test(clean)) {
    const f4 = CAMPUS_FLOORS.find((f) => f.floorNumber === 4);
    if (f4 && f4.rooms.length > 0) return { room: f4.rooms[0], floorNumber: 4 };
  }
  if (/Ground\s*Floor|Floor\s*0|Level\s*0/i.test(clean)) {
    const f0 = CAMPUS_FLOORS.find((f) => f.floorNumber === 0);
    if (f0 && f0.rooms.length > 0) return { room: f0.rooms[0], floorNumber: 0 };
  }

  // 5. Fallback: Infer floor by first digit of 3-digit room number
  if (firstDigit !== null && firstDigit >= 0 && firstDigit <= 4) {
    const targetFloor = CAMPUS_FLOORS.find((f) => f.floorNumber === firstDigit);
    if (targetFloor && targetFloor.rooms.length > 0) {
      const closest = targetFloor.rooms.find((r) => r.code.includes(roomNum)) || targetFloor.rooms[0];
      return { room: closest, floorNumber: firstDigit };
    }
  }

  return null;
}
