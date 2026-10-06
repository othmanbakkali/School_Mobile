const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const rawOdooUrl = process.env.ODOO_URL || 'http://68.183.19.16:8069';
const ODOO_URL = rawOdooUrl.replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const callOdoo = async (service, method, args, kwargs = {}) => {
    const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args, kwargs },
        id: Math.floor(Math.random() * 1000)
    }, { timeout: 30000 });
    if (response.data.error) {
        throw new Error(response.data.error.data?.message || response.data.error.message || JSON.stringify(response.data.error));
    }
    return response.data.result;
};

const sampleRegulations = [
    {
        title: "ميثاق الحياة المدرسية والقانون الداخلي العام للمؤسسة",
        category: "general",
        is_pinned: true,
        sequence: 10,
        author: "إدارة المؤسسة",
        target: "all",
        content: `يهدف هذا القانون الداخلي إلى تنظيم الحياة المدرسية وضمان مناخ تربوي سليم ومحفز على التعلم والاحترام المتبادل داخل المؤسسة.

المبادئ العامة:
1. احترام كافة أطر المؤسسة الإدارية والتربوية وجميع الزملاء.
2. التحلي بالسلوك القويم والأخلاق الفاضلة داخل وخارج الحرم المدرسي.
3. المحافظة التامة على مرافق المؤسسة، الأثاث المدرسي، والأجهزة التعليمية.
4. الالتزام بحمل بطاقة التلميذ والدفتر المدرسي بصفة مستمرة.

تعتبر هذه الوثيقة عقدا معنويا يربط التلميذ وأولياء أمره بالمؤسسة منذ تأكيد التسجيل.`
    },
    {
        title: "Horaires des cours, retards et gestion des absences",
        category: "attendance",
        is_pinned: true,
        sequence: 20,
        author: "Direction Pédagogique",
        target: "all",
        content: `Pour garantir la ponctualité et la continuité des apprentissages, l'établissement applique les dispositions suivantes :

1. Horaires officiels :
- Matin : Entrée à 08h00, début des cours à 08h15. Sortie à 12h00.
- Après-midi : Entrée à 14h00, début des cours à 14h15. Sortie à 18h00.

2. Gestion des retards :
- Les portes sont fermées à 08h15 et à 14h15 précises.
- Tout élève en retard doit impérativement se présenter à la surveillance générale pour obtenir un billet d'entrée.
- Trois retards non justifiés entraînent un avertissement et la convocation des parents.

3. Justification des absences :
- Toute absence doit être signalée le jour même par le parent via l'application mobile ou par téléphone.
- À son retour, l'élève doit présenter un certificat médical ou un mot d'excuse écrit par le tuteur légal.`
    },
    {
        title: "ضوابط الهندام والزي المدرسي الموحد",
        category: "discipline",
        is_pinned: false,
        sequence: 30,
        author: "الحراسة العامة",
        target: "all",
        content: `يشكل الزي المدرسي رمزا للانتماء والمساواة بين المتعلمين، ويلتزم الجميع بالآتي:

1. ارتداء الوزرة المدرسية الرسمية المعتمدة طيلة أوقات الدوام والأنشطة المدرسية.
2. الالتزام بهندام نظيف ومحترم يليق بالحرم المدرسي وهيبته.
3. يُمنع ارتداء ملابس غير لائقة أو ملابس رياضية إلا أثناء حصص التربية البدنية والرياضية.
4. العناية بالنظافة الشخصية والظهور بمظهر لائق يعكس صورة المؤسسة.`
    },
    {
        title: "Interdiction formelle des smartphones et appareils connectés",
        category: "discipline",
        is_pinned: true,
        sequence: 40,
        author: "Direction Générale",
        target: "all",
        content: `Conformément aux directives ministérielles et afin de préserver la concentration des élèves :

1. L'usage des téléphones portables, tablettes personnelles, écouteurs et montres connectées est strictement interdit dans l'enceinte de l'école (salles de cours, couloirs et cour de récréation).
2. Tout appareil visible ou utilisé sans autorisation expresse d'un enseignant sera immédiatement confisqué et remis à la direction.
3. L'appareil confisqué ne sera restitué qu'aux parents de l'élève après signature d'un engagement.
4. En cas d'urgence avérée, les élèves peuvent utiliser la ligne téléphonique de l'administration scolaire pour contacter leurs parents.`
    },
    {
        title: "المذكرة الوزارية المنظمة للامتحانات وفروض المراقبة المستمرة",
        category: "law",
        is_pinned: false,
        sequence: 50,
        author: "وزارة التربية الوطنية والتعليم الأولي والرياضة",
        target: "all",
        content: `تنفيذا للمقتضيات التشريعية والتنظيمية الجاري بها العمل بالمملكة المغربية:

1. تخضع جميع فروض المراقبة المستمرة لمبدأ الإنصاف والشفافية وتغطية المقررات الدراسية الرسمية.
2. كل غياب غير مبرر عن الفرض المحروس يترتب عنه منح نقطة الصفر (0/20) وفق المساطر التنظيمية.
3. يُعتبر أي شكل من أشكال الغش أو محاولة الغش خطأ جسيما يعرض صاحبه للعقوبات التأديبية المنصوص عليها قانونا والتي قد تصل إلى الإلغاء والحرمان من دورات الامتحانات.
4. تُسلم أوراق التحرير المصححة للتلاميذ للاطلاع على ملاحظات الأستاذ وتدارك التعثرات في إطار الدعم التربوي المندمج.`
    },
    {
        title: "Règlement d'usage des bus de transport scolaire",
        category: "safety",
        is_pinned: false,
        sequence: 60,
        author: "Service Transport",
        target: "all",
        content: `Pour la sécurité et le bien-être de tous lors des trajets quotidiens :

1. L'élève doit être présent au point de ramassage 5 minutes avant l'heure prévue. Le chauffeur ne peut pas attendre les retardataires.
2. Respect absolu des consignes de l'accompagnatrice et du chauffeur.
3. Rester assis et attacher sa ceinture de sécurité pendant tout le trajet jusqu'à l'arrêt complet du véhicule.
4. Tout comportement perturbateur, violent ou détérioration du matériel du bus peut entraîner une suspension temporaire ou définitive du service de transport.`
    },
    {
        title: "ميثاق استخدام المكتبة وقاعة المعلوميات والإنترنت",
        category: "hygiene",
        is_pinned: false,
        sequence: 70,
        author: "المسؤول التربوي الرقمي",
        target: "all",
        content: `وضعت المؤسسة رهن إشارة المتعلمين فضاءات رقمية ومكتبة للمطالعة والبحث:

1. الحفاظ على الهدوء التام داخل المكتبة وقاعة التكنولوجيا لتمكين الجميع من التركيز.
2. الحواسيب والأجهزة اللوحية مخصصة حصريا للأغراض التعليمية والمشاريع المدرسية.
3. يُمنع منعا كليا تحميل برامج غير مرخصة أو الدخول إلى مواقع غير ملائمة للسن المتمدرس.
4. إعادة الكتب والمراجع المعارة في الآجال المحددة وفي حالة جيدة.`
    }
];

async function seed() {
    console.log(`🔌 Connexion à Odoo (${ODOO_URL}, DB: ${ODOO_DB})...`);
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    console.log(`✅ Connecté en tant qu'administrateur (UID: ${uid})`);

    // Verify model exists
    console.log(`🔍 Vérification du modèle school.regulation...`);
    const existing = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.regulation', 'search_count',
        [[]]
    ]);
    console.log(`Nombre actuel de règlements enregistrés : ${existing}`);

    if (existing > 0) {
        console.log(`⚠️ Des règlements existent déjà (${existing}). Ajout des règlements manquants...`);
    }

    // Get current school year if available
    let yearId = false;
    try {
        const years = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.year', 'search_read',
            [[['current', '=', true]]], { fields: ['id'], limit: 1 }
        ]);
        if (years && years.length > 0) {
            yearId = years[0].id;
        }
    } catch (e) {
        // ignore
    }

    const today = new Date().toISOString().split('T')[0];

    for (const item of sampleRegulations) {
        // Check if already exists by title
        const found = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.regulation', 'search_read',
            [[['title', '=', item.title]]], { fields: ['id'] }
        ]);

        if (found && found.length > 0) {
            console.log(`⏩ [Existe déjà] ${item.title}`);
            continue;
        }

        const record = {
            title: item.title,
            category: item.category,
            is_pinned: item.is_pinned,
            sequence: item.sequence,
            author: item.author,
            target: item.target,
            content: item.content,
            date: today,
            active: true
        };
        if (yearId) {
            record.year_id = yearId;
        }

        const newId = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.regulation', 'create',
            [record]
        ]);
        console.log(`✅ [Créé ID ${newId}] ${item.title}`);
    }

    console.log(`🎉 Seeding des règlements et lois terminé avec succès !`);
}

seed().catch(err => {
    console.error('❌ Erreur lors du seeding :', err.message);
    process.exit(1);
});
