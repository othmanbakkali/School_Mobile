const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testGrades() {
    try {
        const res = await axios.post('http://localhost:3000/api/school/grades', { student_id: 1 });
        console.log('Returned', res.data.length, 'subjects for student 1:');
        if (res.data.length > 0) {
            console.log(JSON.stringify(res.data[0], null, 2));
        }
    } catch (e) {
        console.log('Local server response or error:', e.message);
    }
}
testGrades();
