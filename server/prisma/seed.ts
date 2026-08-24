import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SwasthyaPulse Healthcare database seeding...');

  // Clean existing records in correct order
  await prisma.medicationReminder.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.slotHold.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.emailQueue.deleteMany();
  await prisma.googleOAuthToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Sunita Agarwal (Chief Administrator)',
      email: 'admin@carepulse.demo',
      password: defaultPassword,
      role: 'ADMIN',
      phone: '+91 98201 45982',
    },
  });

  // 2. Create Doctors with authentic Indian names & INR fees
  const doctorsData = [
    {
      name: 'Dr. Rajesh Swaminathan, MD',
      email: 'doctor@carepulse.demo',
      specialisation: 'Cardiology',
      experienceYears: 16,
      consultationFee: 1200.0,
      slotDurationMinutes: 30,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
      rating: 4.95,
      bio: 'Senior Consultant Cardiologist specializing in preventative cardiology, hypertension control, and arrhythmia management.',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Ananya Deshmukh, MD',
      email: 'ananya.dermatology@carepulse.demo',
      specialisation: 'Dermatology',
      experienceYears: 11,
      consultationFee: 900.0,
      slotDurationMinutes: 20,
      workingHoursStart: '08:30',
      workingHoursEnd: '16:30',
      breakStart: '12:30',
      breakEnd: '13:30',
      workingDays: 'Monday,Tuesday,Wednesday,Thursday',
      rating: 4.89,
      bio: 'Consultant Dermatologist focusing on clinical dermatology, acute eczema, contact allergy management, and trichology.',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813629-87a41c4f6974?w=200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Vikramaditya Kulkarni, MD',
      email: 'vikram.pediatrics@carepulse.demo',
      specialisation: 'Pediatrics',
      experienceYears: 14,
      consultationFee: 800.0,
      slotDurationMinutes: 30,
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      workingDays: 'Monday,Wednesday,Thursday,Friday,Saturday',
      rating: 4.93,
      bio: 'Senior Pediatrician devoted to child growth milestones, newborn care, and childhood allergy management.',
      avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Meera Iyer, DM',
      email: 'meera.neurology@carepulse.demo',
      specialisation: 'Neurology',
      experienceYears: 18,
      consultationFee: 1500.0,
      slotDurationMinutes: 45,
      workingHoursStart: '10:00',
      workingHoursEnd: '18:00',
      breakStart: '14:00',
      breakEnd: '15:00',
      workingDays: 'Monday,Tuesday,Wednesday,Friday',
      rating: 4.98,
      bio: 'Leading Neurologist with expertise in migraine management, peripheral neuropathy, and sleep medicine.',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Siddharth Sengupta, MS',
      email: 'siddharth.ortho@carepulse.demo',
      specialisation: 'Orthopedics',
      experienceYears: 13,
      consultationFee: 1000.0,
      slotDurationMinutes: 30,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      workingDays: 'Tuesday,Wednesday,Thursday,Friday',
      rating: 4.87,
      bio: 'Orthopedic surgeon specializing in joint mobility, sports injuries, knee pain management, and spinal alignment.',
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
    },
  ];

  const createdDoctors = [];
  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        name: doc.name,
        email: doc.email,
        password: defaultPassword,
        role: 'DOCTOR',
        avatarUrl: doc.avatarUrl,
      },
    });

    const profile = await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        specialisation: doc.specialisation,
        experienceYears: doc.experienceYears,
        consultationFee: doc.consultationFee,
        slotDurationMinutes: doc.slotDurationMinutes,
        workingHoursStart: doc.workingHoursStart,
        workingHoursEnd: doc.workingHoursEnd,
        breakStart: doc.breakStart,
        breakEnd: doc.breakEnd,
        workingDays: doc.workingDays,
        bio: doc.bio,
        rating: doc.rating,
      },
      include: { user: true },
    });
    createdDoctors.push(profile);
  }

  // 3. Create Patients with authentic Indian names
  const patient1 = await prisma.user.create({
    data: {
      name: 'Aarav Sharma (Demo Patient)',
      email: 'patient@carepulse.demo',
      password: defaultPassword,
      role: 'PATIENT',
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya.patel@carepulse.demo',
      password: defaultPassword,
      role: 'PATIENT',
      phone: '+91 98112 34567',
    },
  });

  // Calculate Dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const pastDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const pastDateStr = pastDate.toISOString().split('T')[0];

  const mainDoctor = createdDoctors[0]; // Dr. Rajesh Swaminathan

  // 4. Create Completed Past Appointment with Prescription & Reminders
  const completedAppt = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: mainDoctor.id,
      date: pastDateStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'COMPLETED',
      symptoms: 'Mild chest heaviness after evening walk and occasional palpitations after drinking tea.',
      urgencyLevel: 'MEDIUM',
      chiefComplaint: 'Occasional exertional chest heaviness and mild palpitations',
      suggestedQuestions: JSON.stringify([
        'How frequently do these chest palpitations occur during physical activity?',
        'Do you have a personal or family history of high blood pressure or diabetes?',
        'Have you noticed any shortness of breath or dizziness while climbing stairs?',
      ]),
      aiTriageSummary: 'Patient presents with mild exertional chest heaviness. Triage urgency evaluated as MEDIUM.',
      clinicalNotes: 'ECG demonstrated normal sinus rhythm. BP 128/84 mmHg. Prescribed Metoprolol 25mg and Pantoprazole 40mg. Advised reduction in tea/coffee and brisk 30-min morning walks.',
      postVisitSummary: 'Dr. Swaminathan reviewed your ECG and confirmed normal cardiac rhythm. You have been prescribed Metoprolol to keep your heart rate steady and Pantoprazole for gastric relief. Please follow the morning medication schedule.',
      followUpSteps: JSON.stringify([
        'Take Metoprolol 25mg once daily in the morning after breakfast.',
        'Take Pantoprazole 40mg before breakfast.',
        'Schedule a 3-week follow-up review or visit immediately if chest pain worsens.',
      ]),
      meetLink: 'https://meet.google.com/swasthya-rajesh-med',
    },
  });

  // Create Prescription for Completed Appointment
  const prescription = await prisma.prescription.create({
    data: {
      appointmentId: completedAppt.id,
      medicationName: 'Metoprolol 25mg (Betaloc)',
      dosage: '25mg',
      frequency: 'Once Daily Morning',
      durationDays: 14,
      instructions: 'Take 1 tablet every morning with breakfast and water.',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Create Medication Reminder for today
  await prisma.medicationReminder.create({
    data: {
      prescriptionId: prescription.id,
      patientId: patient1.id,
      scheduledDate: todayStr,
      scheduledTime: '08:30',
      status: 'PENDING',
    },
  });

  // 5. Create Confirmed Upcoming Appointment for Today (High Urgency)
  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: mainDoctor.id,
      date: todayStr,
      startTime: '14:30',
      endTime: '15:00',
      status: 'CONFIRMED',
      symptoms: 'Sudden onset sharp chest tightness lasting 15 minutes radiating to left shoulder with sweating.',
      urgencyLevel: 'HIGH',
      chiefComplaint: 'Acute sharp chest tightness with shoulder radiation and profuse sweating',
      suggestedQuestions: JSON.stringify([
        'Did the tightness start while resting or during strenuous activity?',
        'Are you feeling associated nausea, breathlessness, or lightheadedness?',
        'Do you have any existing hypertension or family cardiac history?',
      ]),
      aiTriageSummary: 'Patient reports acute chest tightness with radiation. HIGH URGENCY triage assigned.',
      meetLink: 'https://meet.google.com/swasthya-rajesh-urg',
    },
  });

  // 6. Create Confirmed Appointment for Tomorrow with Dr. Ananya (Dermatology)
  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: createdDoctors[1].id,
      date: tomorrowStr,
      startTime: '11:00',
      endTime: '11:20',
      status: 'CONFIRMED',
      symptoms: 'Itchy red skin rash across forearms after gardening, mild swelling.',
      urgencyLevel: 'LOW',
      chiefComplaint: 'Allergic contact dermatitis with erythematous skin rash',
      suggestedQuestions: JSON.stringify([
        'Have you encountered unusual plants or new chemical detergents?',
        'Have you applied any topical ointments or taken antihistamines?',
        'Is there any warmth, oozing, or spreading to other parts of the body?',
      ]),
      aiTriageSummary: 'Mild contact dermatitis symptoms. LOW urgency triage assigned.',
      meetLink: 'https://meet.google.com/swasthya-ananya-derm',
    },
  });

  console.log('✅ SwasthyaPulse Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Quick Login Demo Accounts:');
  console.log('  👨‍⚕️ Doctor:  doctor@carepulse.demo  (Dr. Rajesh Swaminathan)');
  console.log('  🧑 Patient: patient@carepulse.demo (Aarav Sharma)');
  console.log('  🛡️ Admin:   admin@carepulse.demo   (Sunita Agarwal)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
