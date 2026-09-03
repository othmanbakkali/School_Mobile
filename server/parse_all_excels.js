const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

console.log(`Processing ${files.length} Excel files...\n`);

const studentsMap = new Map(); // massar_number -> { name, massar_number, ems_id, birth_date, class_code, level_name }
const classesMap = new Map();  // class_code -> { code, name }
const teachersSet = new Set();
const marksList = [];

files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
        const wb = xlsx.readFile(filePath);
        const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // Metadata extraction
        let levelName = '';
        let classCode = '';
        let teacherName = '';
        let semester = '';
        let examType = '';
        let subjectName = '';

        for (let i = 0; i < Math.min(rows.length, 14); i++) {
            const r = rows[i] || [];
            for (let j = 0; j < r.length; j++) {
                const cell = String(r[j] || '').trim();
                if (cell.includes('المستوى')) {
                    levelName = String(r[j+1] || '').trim();
                }
                if (cell.includes('القسم')) {
                    classCode = String(r[j+2] || r[j+1] || '').trim();
                }
                if (cell.includes('الاستاذ') || cell.includes('الأستاذ')) {
                    teacherName = String(r[j+2] || r[j+1] || '').trim();
                }
                if (cell.includes('الدورة')) {
                    semester = String(r[j+1] || '').trim();
                }
                if (cell.includes('نقط')) {
                    examType = String(r[j+2] || r[j+1] || '').trim();
                }
                if (cell.includes('المادة')) {
                    subjectName = String(r[j+2] || r[j+1] || '').trim();
                }
            }
        }

        if (classCode) {
            classesMap.set(classCode, { code: classCode, name: levelName || classCode });
        }
        if (teacherName) {
            teachersSet.add(teacherName);
        }

        // Header detection (find row containing 'رقم التلميذ' or 'إسم التلميذ')
        let headerRowIndex = -1;
        for (let i = 12; i < Math.min(rows.length, 20); i++) {
            const r = rows[i] || [];
            if (r.some(c => String(c).includes('رقم') || String(c).includes('إسم') || String(c).includes('تلميذ'))) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex !== -1) {
            const headerCols = rows[headerRowIndex] || [];
            const subCols = rows[headerRowIndex + 1] || [];

            // Identify student data start (headerRowIndex + 2 or +1)
            let dataStart = headerRowIndex + 1;
            if (subCols.some(c => String(c).includes('النقطة') || String(c).includes('التغيب'))) {
                dataStart = headerRowIndex + 2;
            }

            for (let i = dataStart; i < rows.length; i++) {
                const r = rows[i] || [];
                if (!r || r.length < 3) continue;
                
                const emsId = r[1];
                const massar = String(r[2] || '').trim();
                const name = String(r[3] || '').trim();
                const birthDate = String(r[5] || '').trim();

                if (massar && name && massar.length >= 5) {
                    if (!studentsMap.has(massar)) {
                        studentsMap.set(massar, {
                            name,
                            massar_number: massar,
                            ems_id: typeof emsId === 'number' ? emsId : parseInt(emsId) || null,
                            birth_date: birthDate,
                            class_code: classCode,
                            level_name: levelName
                        });
                    }

                    // Extract marks
                    for (let c = 6; c < r.length; c += 2) {
                        const subSubject = headerCols[c];
                        const noteType = subCols[c];
                        const noteVal = r[c];
                        if (noteVal !== undefined && noteVal !== null && typeof noteVal === 'number') {
                            marksList.push({
                                massar_number: massar,
                                student_name: name,
                                class_code: classCode,
                                subject: subjectName,
                                sub_subject: subSubject,
                                mark: noteVal,
                                semester: semester,
                                exam: examType,
                                file: file
                            });
                        }
                    }
                }
            }
        }

        console.log(`✓ ${file} -> Classe: ${classCode} (${levelName}), Matière: ${subjectName}, Prof: ${teacherName || 'N/A'}`);
    } catch (e) {
        console.error(`✗ Error in ${file}:`, e.message);
    }
});

console.log(`\n================ SUMMARY ================`);
console.log(`Total Unique Classes: ${classesMap.size}`);
classesMap.forEach((v, k) => console.log(`  - [${k}] ${v.name}`));

console.log(`Total Teachers: ${teachersSet.size}`);
teachersSet.forEach(t => console.log(`  - ${t}`));

console.log(`Total Unique Students: ${studentsMap.size}`);
let count = 0;
studentsMap.forEach((s, m) => {
    if (count < 10) console.log(`  - [${m}] ${s.name} (Classe: ${s.class_code})`);
    count++;
});
if (studentsMap.size > 10) console.log(`  ... and ${studentsMap.size - 10} more students.`);

console.log(`Total Marks Extracted: ${marksList.length}`);
