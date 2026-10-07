/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { titleService } from "@web/core/title_service";

if (titleService) {
    const originalStart = titleService.start;
    titleService.start = function (env) {
        const titleObj = originalStart.apply(this, arguments);
        const originalSetParts = titleObj.setParts ? titleObj.setParts.bind(titleObj) : null;
        if (originalSetParts) {
            titleObj.setParts = function (parts) {
                if (parts && typeof parts === "object") {
                    if (parts.zopenerp) {
                        parts.zopenerp = "Alibdaealalamia";
                    }
                    if (parts.odoo) {
                        parts.odoo = "Alibdaealalamia";
                    }
                }
                const res = originalSetParts(parts);
                if (document.title && document.title.includes("Odoo")) {
                    document.title = document.title.replace(/Odoo/gi, "Alibdaealalamia");
                }
                return res;
            };
        }
        return titleObj;
    };
}

// Nettoyeur global du titre de document
const cleanAppTitle = () => {
    if (document.title && /odoo/i.test(document.title)) {
        document.title = document.title.replace(/Odoo/gi, "Alibdaealalamia");
    }
};

setInterval(cleanAppTitle, 1000);
if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", cleanAppTitle);
}
