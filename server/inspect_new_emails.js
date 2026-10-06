const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia\\New';

// 1. Check CSV
const csvPath = path.join(dir, 'alibdaealamia_names_emails (1).csv');
if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(l => l.trim());
    console.log(`CSV lines count: ${lines.length}`);
    console.log('Sample CSV lines:', lines.slice(0, 5));
}

// 2. Check ODS
const odsPath = path.join(dir, 'parentsemails.ods');
if (fs.existsSync(odsPath)) {
    const wb = xlsx.readFile(odsPath);
    console.log('ODS Sheet Names:', wb.SheetNames);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`ODS rows count: ${data.length}`);
    console.log('Sample ODS rows:', data.slice(0, 5));
}
