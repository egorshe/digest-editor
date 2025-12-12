export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export function mapCSLType(cslType) {
    const typeMap = {
        book: "Book", chapter: "Chapter", "article-journal": "Article",
        "article-magazine": "Article", "article-newspaper": "Article",
        "paper-conference": "Article", thesis: "Thesis",
        webpage: "Online Article", "post-weblog": "Blog Post",
    };
    return typeMap[cslType] || "Article";
}

export function formatCSLDate(issued) {
    if (!issued) return "";
    if (issued["date-parts"] && issued["date-parts"][0]) {
        return issued["date-parts"][0].join("-");
    }
    if (issued.raw) return issued.raw;
    return "";
}