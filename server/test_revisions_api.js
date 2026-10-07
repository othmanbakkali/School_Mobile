const axios = require('axios');

async function test() {
    console.log('Testing /api/school/revisions on live server...');
    const revsRes = await axios.post('http://68.183.19.16:3000/api/school/revisions', {
        student_id: 1,
        activity_type: 'revision'
    });
    console.log('Revisions response:', revsRes.data);

    console.log('\nTesting /api/school/daily-challenges...');
    const chRes = await axios.post('http://68.183.19.16:3000/api/school/daily-challenges', {
        student_id: 1
    });
    console.log('Challenges response:', chRes.data);

    if (revsRes.data.revisions && revsRes.data.revisions.length > 0) {
        const rev = revsRes.data.revisions[0];
        console.log('\nTesting submission for revision #' + rev.id + ' (' + rev.name + ')...');
        const answers = {};
        if (rev.questions && rev.questions.length > 0) {
            answers[rev.questions[0].id] = 'A';
            if (rev.questions[1]) answers[rev.questions[1].id] = 'B';
            if (rev.questions[2]) answers[rev.questions[2].id] = 'C';
        }
        const submitRes = await axios.post('http://68.183.19.16:3000/api/school/revisions/submit', {
            student_id: 1,
            revision_id: rev.id,
            answers: answers
        });
        console.log('Submit evaluation result:', submitRes.data);
    }

    console.log('\nTesting /api/school/student/ludic-stats...');
    const statsRes = await axios.post('http://68.183.19.16:3000/api/school/student/ludic-stats', {
        student_id: 1
    });
    console.log('Ludic stats result:', statsRes.data);
}

test().catch(e => console.error('Error:', e.response ? e.response.data : e.message));
