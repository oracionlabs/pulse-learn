import mongoose from 'mongoose'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const MONGO_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/pulse'

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  // Drop existing seed data
  const db = mongoose.connection.db!
  const slugs = ['acme-corp', 'globex-inc']
  const orgsToDelete = await db.collection('organizations').find({ slug: { $in: slugs } }).toArray()
  const orgIds = orgsToDelete.map((o) => o._id)

  const seedEmails = [
    'admin@acme.com','admin@globex.com',
    'sarah.chen@acme.com',
    'carol.chen@acme.com','david.park@acme.com','emma.torres@acme.com','frank.wu@acme.com',
    'grace.kim@acme.com','henry.adams@acme.com','isabel.lopez@acme.com','james.lee@acme.com',
    'karen.martin@acme.com','liam.johnson@acme.com',
    'mia.smith@globex.com','noah.brown@globex.com','olivia.davis@globex.com','peter.wilson@globex.com',
    'quinn.taylor@globex.com','rachel.moore@globex.com','sam.anderson@globex.com',
    'tina.thomas@globex.com','uma.jackson@globex.com','victor.harris@globex.com',
  ]

  await Promise.all([
    db.collection('organizations').deleteMany({ slug: { $in: slugs } }),
    db.collection('users').deleteMany({ email: { $in: seedEmails } }),
    db.collection('workshops').deleteMany({ $or: [{ orgId: { $in: orgIds } }, { isTemplate: true }] }),
    db.collection('assignments').deleteMany({ orgId: { $in: orgIds } }),
  ])

  // Create orgs
  const acme = await db.collection('organizations').insertOne({
    name: 'Acme Corp',
    slug: 'acme-corp',
    plan: 'pro',
    verticals: ['security', 'compliance'],
    settings: {
      ssoProvider: 'none',
      defaultTimezone: 'America/New_York',
      brandColor: '#6366f1',
      workshopReminders: true,
      leaderboardEnabled: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const globex = await db.collection('organizations').insertOne({
    name: 'Globex Inc',
    slug: 'globex-inc',
    plan: 'starter',
    verticals: ['onboarding', 'sales'],
    settings: {
      ssoProvider: 'none',
      defaultTimezone: 'America/Chicago',
      brandColor: '#10b981',
      workshopReminders: true,
      leaderboardEnabled: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12)

  const acmeAdmin = await db.collection('users').insertOne({
    orgId: acme.insertedId,
    email: 'admin@acme.com',
    passwordHash,
    name: 'Alice Admin',
    role: 'org_admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const globexAdmin = await db.collection('users').insertOne({
    orgId: globex.insertedId,
    email: 'admin@globex.com',
    passwordHash,
    name: 'Bob Builder',
    role: 'org_admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.collection('users').insertOne({
    orgId: acme.insertedId,
    email: 'sarah.chen@acme.com',
    passwordHash,
    name: 'Sarah Chen',
    role: 'manager',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Seed learners for Acme
  const acmeLearners = ['Carol Chen', 'David Park', 'Emma Torres', 'Frank Wu', 'Grace Kim',
    'Henry Adams', 'Isabel Lopez', 'James Lee', 'Karen Martin', 'Liam Johnson']

  for (const name of acmeLearners) {
    const email = name.toLowerCase().replace(' ', '.') + '@acme.com'
    await db.collection('users').insertOne({
      orgId: acme.insertedId,
      email,
      passwordHash,
      name,
      role: 'learner',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Seed learners for Globex
  const globexLearners = ['Mia Smith', 'Noah Brown', 'Olivia Davis', 'Peter Wilson',
    'Quinn Taylor', 'Rachel Moore', 'Sam Anderson', 'Tina Thomas', 'Uma Jackson', 'Victor Harris']

  for (const name of globexLearners) {
    const email = name.toLowerCase().replace(' ', '.') + '@globex.com'
    await db.collection('users').insertOne({
      orgId: globex.insertedId,
      email,
      passwordHash,
      name,
      role: 'learner',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Workshop templates
  const templates = [
    {
      title: 'Phishing Awareness 101',
      vertical: 'security',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'What is Phishing?', points: 0,
          content: { body: '## What is Phishing?\n\nPhishing is a cyberattack where criminals impersonate trusted entities to steal credentials or install malware.\n\n**Common signs:**\n- Urgent or threatening language\n- Suspicious sender address\n- Unexpected attachments or links' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 1, type: 'quiz', title: 'Spot the Phish', points: 20,
          quiz: { question: 'You receive an email from "support@paypa1.com" asking you to verify your account. What should you do?',
            options: ['Click the link and verify your account', 'Report it as phishing and delete it', 'Forward it to your colleagues', 'Reply asking for more information'],
            correctAnswerIndex: 1,
            explanation: 'The domain "paypa1.com" uses the number 1 instead of the letter l — a classic spoofing technique. Always verify sender domains carefully.' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 2, type: 'scenario', title: 'Your CEO Needs Help', points: 30,
          scenario: { prompt: 'You receive a text from your CEO\'s number: "I\'m in an urgent meeting. Buy $500 in gift cards and send me the codes." What do you do?',
            choices: [
              { id: uuidv4(), text: 'Buy the gift cards — the CEO is clearly in a rush', feedback: 'This is a classic CEO fraud attack. Real executives never request gift cards via text.', isCorrect: false },
              { id: uuidv4(), text: 'Call your CEO directly on their known number to verify', feedback: 'Correct! Always verify unusual requests through a different channel you trust.', isCorrect: true },
              { id: uuidv4(), text: 'Email your CEO to confirm', feedback: 'Email can also be compromised. Call directly on a number you already know.', isCorrect: false },
            ] },
          animationType: 'fade_in' },
        { stepId: uuidv4(), order: 3, type: 'reflection', title: 'What Will You Do Differently?', points: 10,
          reflection: { prompt: 'Think about your daily email habits. What is one specific thing you will start checking before clicking links in emails?', minLength: 40, maxLength: 300 },
          animationType: 'slide_up' },
      ],
    },
    {
      title: 'Password Hygiene Best Practices',
      vertical: 'security',
      difficulty: 'beginner',
      estimatedMinutes: 6,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'Why Passwords Matter', points: 0,
          content: { body: '## The Password Problem\n\nOver 80% of data breaches involve weak or reused passwords.\n\n**Best practices:**\n- Use at least 16 characters\n- Mix letters, numbers, and symbols\n- Never reuse passwords across sites\n- Use a password manager' },
          animationType: 'typewriter' },
        { stepId: uuidv4(), order: 1, type: 'quiz', title: 'Strong Password Quiz', points: 20,
          quiz: { question: 'Which of these is the strongest password?',
            options: ['Password123!', 'MyDog$Name2019', 'Tr0ub4dor&3', 'correct-horse-battery-staple-42'],
            correctAnswerIndex: 3,
            explanation: 'A long passphrase with random words and numbers is both strong and memorable. Length beats complexity.' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 2, type: 'quiz', title: 'Password Manager', points: 20,
          quiz: { question: 'What is the primary benefit of a password manager?',
            options: ['It makes your passwords visible to IT', 'It allows you to use one strong password everywhere', 'It generates and stores unique passwords for every site', 'It automatically changes your passwords monthly'],
            correctAnswerIndex: 2,
            explanation: 'Password managers generate unique, strong passwords for each site and store them securely — you only need to remember one master password.' },
          animationType: 'slide_up' },
      ],
    },
    {
      title: 'GDPR Compliance Essentials',
      vertical: 'compliance',
      difficulty: 'intermediate',
      estimatedMinutes: 8,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'What is GDPR?', points: 0,
          content: { body: '## General Data Protection Regulation\n\nGDPR is the EU\'s landmark privacy law that protects personal data of EU residents.\n\n**Key principles:**\n- Lawfulness, fairness, and transparency\n- Purpose limitation\n- Data minimization\n- Accuracy\n- Storage limitation\n- Integrity and confidentiality' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 1, type: 'quiz', title: 'GDPR Knowledge Check', points: 25,
          quiz: { question: 'Under GDPR, within how many hours must you report a data breach to the supervisory authority?',
            options: ['24 hours', '48 hours', '72 hours', '7 days'],
            correctAnswerIndex: 2,
            explanation: 'GDPR Article 33 requires notification to the supervisory authority within 72 hours of becoming aware of a breach, where feasible.' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 2, type: 'scenario', title: 'The Data Request', points: 30,
          scenario: { prompt: 'A customer emails: "Please delete all personal data you have about me." Under GDPR, what must you do?',
            choices: [
              { id: uuidv4(), text: 'Ignore it — we need the data for our records', feedback: 'This violates the Right to Erasure under GDPR Article 17.', isCorrect: false },
              { id: uuidv4(), text: 'Honor the request within 30 days, with limited exceptions', feedback: 'Correct! The Right to Erasure must generally be honored within one calendar month.', isCorrect: true },
              { id: uuidv4(), text: 'Ask them to pay a fee for data deletion', feedback: 'GDPR prohibits charging for rights requests except in limited circumstances.', isCorrect: false },
            ] },
          animationType: 'fade_in' },
      ],
    },
    {
      title: 'New Employee Onboarding: Day 1',
      vertical: 'onboarding',
      difficulty: 'beginner',
      estimatedMinutes: 7,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'Welcome to the Team!', points: 0,
          content: { body: '## Welcome!\n\nWe\'re thrilled you joined us. This workshop covers the essentials for your first day.\n\n**Today you\'ll learn:**\n- How we communicate\n- Key tools and systems\n- Core values and culture\n- Who to ask for help' },
          animationType: 'bounce' },
        { stepId: uuidv4(), order: 1, type: 'quiz', title: 'Communication Tools', points: 15,
          quiz: { question: 'Where should you post questions visible to your entire team?',
            options: ['Direct message to your manager', 'Company-wide Slack channel', 'Team channel in Slack', 'Email to HR'],
            correctAnswerIndex: 2,
            explanation: 'Team channels keep conversations visible and searchable for everyone. Use DMs for private, sensitive matters only.' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 2, type: 'reflection', title: 'Your 30-Day Goal', points: 15,
          reflection: { prompt: 'What is one specific thing you want to accomplish in your first 30 days? Be as specific as possible.', minLength: 50, maxLength: 400 },
          animationType: 'slide_up' },
      ],
    },
    {
      title: 'Handling Objections in Sales',
      vertical: 'sales',
      difficulty: 'intermediate',
      estimatedMinutes: 6,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'Objections Are Opportunities', points: 0,
          content: { body: '## Turn Objections Into Conversations\n\nObjections are not rejections — they\'re requests for more information.\n\n**The LAER framework:**\n1. **Listen** — hear them out fully\n2. **Acknowledge** — validate their concern\n3. **Explore** — ask questions to understand the root cause\n4. **Respond** — address the real concern' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 1, type: 'scenario', title: 'The Price Objection', points: 35,
          scenario: { prompt: 'A prospect says: "Your product is too expensive — we can\'t budget for this right now." What is your best response?',
            choices: [
              { id: uuidv4(), text: 'Offer an immediate 20% discount', feedback: 'Discounting immediately signals the price was arbitrary and trains prospects to always push back.', isCorrect: false },
              { id: uuidv4(), text: '"I understand budget is a concern. Can you help me understand what ROI would make this a no-brainer?"', feedback: 'Excellent! This acknowledges the concern and explores the real issue — value, not just price.', isCorrect: true },
              { id: uuidv4(), text: 'Explain all the features they\'d get', feedback: 'Feature dumping rarely addresses a price objection — it\'s about perceived value vs. cost.', isCorrect: false },
            ] },
          animationType: 'fade_in' },
      ],
    },
    {
      title: 'Workplace Safety: Emergency Procedures',
      vertical: 'compliance',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'Emergency Preparedness', points: 0,
          content: { body: '## Know Before You Need It\n\nEmergency preparedness can save lives. Every employee should know:\n\n- **Evacuation routes** — find your nearest two exits\n- **Assembly point** — where to gather after evacuation\n- **Emergency contacts** — know who to call\n- **First aid kits** — know their locations on your floor' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 1, type: 'quiz', title: 'Fire Safety Quiz', points: 20,
          quiz: { question: 'You discover a small fire in the break room. What should you do first?',
            options: ['Try to put it out with a fire extinguisher', 'Call 911 immediately', 'Alert others and activate the fire alarm', 'Close all doors and windows'],
            correctAnswerIndex: 2,
            explanation: 'Alert others and activate the alarm first — this starts evacuation. Only use an extinguisher if trained and the fire is very small and contained.' },
          animationType: 'slide_up' },
      ],
    },
    {
      title: 'Customer Success: Handling Escalations',
      vertical: 'customer_ed',
      difficulty: 'intermediate',
      estimatedMinutes: 7,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'Turning Angry Customers Into Advocates', points: 0,
          content: { body: '## The Escalation Opportunity\n\nCustomers who complain and get a great resolution are often more loyal than those who never had a problem.\n\n**The 3-step de-escalation approach:**\n1. **Empathize** — acknowledge their frustration without taking it personally\n2. **Own it** — take responsibility, even if it\'s not your fault\n3. **Act** — give them a concrete next step with a timeline' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 1, type: 'scenario', title: 'Angry Customer Call', points: 35,
          scenario: { prompt: 'A customer calls furious: "This is the third time my order has been delayed! I need this fixed NOW!" How do you respond?',
            choices: [
              { id: uuidv4(), text: '"This is not my fault — you need to speak to fulfillment."', feedback: 'Redirecting blame escalates the situation. Own the problem even if it\'s not your team.', isCorrect: false },
              { id: uuidv4(), text: '"I completely understand your frustration. Three delays is unacceptable and I\'m personally going to fix this. Let me pull up your order right now."', feedback: 'Perfect. You acknowledged the emotion, validated it, took ownership, and committed to action.', isCorrect: true },
              { id: uuidv4(), text: '"I apologize for the inconvenience. I\'ll submit a ticket."', feedback: 'Too passive. Generic apologies without action don\'t rebuild trust.', isCorrect: false },
            ] },
          animationType: 'fade_in' },
      ],
    },
    {
      title: 'Anti-Harassment Policy Awareness',
      vertical: 'compliance',
      difficulty: 'beginner',
      estimatedMinutes: 8,
      steps: [
        { stepId: uuidv4(), order: 0, type: 'content', title: 'Creating a Respectful Workplace', points: 0,
          content: { body: '## Our Commitment to a Safe Workplace\n\nEvery employee deserves to work in an environment free from harassment and discrimination.\n\n**What counts as harassment:**\n- Unwelcome comments about appearance, gender, race, religion, or other protected characteristics\n- Physical contact without consent\n- Exclusion or ostracism based on protected characteristics\n- Creating a hostile work environment' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 1, type: 'quiz', title: 'Policy Knowledge Check', points: 20,
          quiz: { question: 'If you witness harassment, what should you do?',
            options: ['Ignore it — it\'s not your business', 'Report it to HR or your manager', 'Confront the harasser publicly', 'Post about it on social media'],
            correctAnswerIndex: 1,
            explanation: 'Report to HR or management. You can also support the victim. Bystander intervention (when safe) can also be appropriate, but reporting is always right.' },
          animationType: 'slide_up' },
        { stepId: uuidv4(), order: 2, type: 'reflection', title: 'Be an Active Bystander', points: 10,
          reflection: { prompt: 'Describe a situation where you could act as an active bystander to support a colleague. What would you do?', minLength: 40, maxLength: 300 },
          animationType: 'slide_up' },
      ],
    },
  ]

  // Insert templates
  for (const tmpl of templates) {
    const totalPoints = tmpl.steps.reduce((s: number, step: { points: number }) => s + step.points, 0)
    await db.collection('workshops').insertOne({
      ...tmpl,
      orgId: null,
      isTemplate: true,
      isPublished: true,
      totalPoints,
      createdBy: acmeAdmin.insertedId,
      publishedAt: new Date(),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Clone templates into org workshops for Acme
  const workshopDocs = await db.collection('workshops').find({ isTemplate: true }).toArray()
  const acmeWorkshops: { _id: (typeof workshopDocs)[0]['_id'] }[] = []

  for (const tmpl of workshopDocs.slice(0, 5)) {
    const cloned = {
      ...tmpl,
      _id: new mongoose.Types.ObjectId(),
      orgId: acme.insertedId,
      isTemplate: false,
      isPublished: true,
      version: 1,
      previousVersionId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await db.collection('workshops').insertOne(cloned)
    acmeWorkshops.push({ _id: result.insertedId })
  }

  // Seed assignments for Acme learners
  const acmeLearnerDocs = await db.collection('users')
    .find({ orgId: acme.insertedId, role: 'learner' })
    .toArray()

  const now = new Date()
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  // Assign first workshop to entire org
  if (acmeWorkshops[0]) {
    await db.collection('assignments').insertOne({
      orgId: acme.insertedId,
      workshopId: acmeWorkshops[0]._id,
      assignedTo: { type: 'org' },
      assignedBy: acmeAdmin.insertedId,
      dueDate: oneWeek,
      priority: 'required',
      status: 'pending',
      completionRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Assign second workshop to first 3 learners, one overdue
  if (acmeWorkshops[1]) {
    for (let i = 0; i < Math.min(3, acmeLearnerDocs.length); i++) {
      await db.collection('assignments').insertOne({
        orgId: acme.insertedId,
        workshopId: acmeWorkshops[1]._id,
        assignedTo: { type: 'user', id: acmeLearnerDocs[i]._id },
        assignedBy: acmeAdmin.insertedId,
        dueDate: i === 0 ? yesterday : twoWeeks, // first one is overdue
        priority: i === 0 ? 'required' : 'recommended',
        status: i === 0 ? 'overdue' : 'pending',
        completionRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Assign third workshop to carol.chen specifically
  if (acmeWorkshops[2] && acmeLearnerDocs[0]) {
    await db.collection('assignments').insertOne({
      orgId: acme.insertedId,
      workshopId: acmeWorkshops[2]._id,
      assignedTo: { type: 'user', id: acmeLearnerDocs[0]._id },
      assignedBy: acmeAdmin.insertedId,
      dueDate: twoWeeks,
      priority: 'optional',
      status: 'pending',
      completionRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  console.log('✓ Seed complete')
  console.log(`  Organizations: acme-corp (admin@acme.com / password123), globex-inc (admin@globex.com / password123)`)
  console.log(`  Users: 1 manager (sarah.chen@acme.com) + 20 learners (10 per org), password: password123`)
  console.log(`  Workshop templates: ${templates.length} global templates`)
  console.log(`  Org workshops: ${acmeWorkshops.length} cloned for Acme Corp`)
  console.log(`  Assignments: org-wide + individual assignments created`)

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
