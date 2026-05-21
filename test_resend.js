const { sendAdmissionEmail } = require('./utils/mailer');
const dotenv = require('dotenv');
dotenv.config();

async function testEmail() {
  console.log("Testing Resend email with mariaydaniel323@gmail.com...");
  const result = await sendAdmissionEmail({
    to: 'mariaydaniel323@gmail.com',
    subject: 'Test Admission - Infinity Tech',
    studentName: 'Test Student',
    courseName: 'Test Course',
    username: 'test_user',
    password: 'password123'
  });
  console.log("Result:", result);
}

testEmail();
