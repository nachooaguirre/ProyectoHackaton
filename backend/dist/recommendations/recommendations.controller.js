"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsController = void 0;
const common_1 = require("@nestjs/common");
const recommendations_service_js_1 = require("./recommendations.service.js");
const recommendation_filters_dto_1 = require("./dto/recommendation-filters.dto");
let RecommendationsController = class RecommendationsController {
    recommendationsService;
    constructor(recommendationsService) {
        this.recommendationsService = recommendationsService;
    }
    async create(body) {
        try {
            const result = await this.recommendationsService.getRecommendations(body);
            return { movies: result };
        }
        catch (err) {
            throw new common_1.HttpException({ message: err?.message ?? 'Failed to generate recommendations' }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.RecommendationsController = RecommendationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recommendation_filters_dto_1.RecommendationFiltersDto]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "create", null);
exports.RecommendationsController = RecommendationsController = __decorate([
    (0, common_1.Controller)('recommendations'),
    __metadata("design:paramtypes", [recommendations_service_js_1.RecommendationsService])
], RecommendationsController);
//# sourceMappingURL=recommendations.controller.js.map