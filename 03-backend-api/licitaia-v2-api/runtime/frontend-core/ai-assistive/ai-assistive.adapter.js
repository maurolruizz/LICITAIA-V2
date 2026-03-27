"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalControlledRefinerAdapter = void 0;
const ai_assistive_config_1 = require("./ai-assistive.config");
function normalizeControlledText(input) {
    return input.replace(/\s+/g, ' ').trim();
}
exports.internalControlledRefinerAdapter = {
    providerId: ai_assistive_config_1.AI_ASSISTIVE_PROVIDER_ID,
    refineText(input) {
        return normalizeControlledText(input);
    },
};
