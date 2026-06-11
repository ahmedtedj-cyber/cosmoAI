import React, { createContext, useContext, useEffect, useState } from 'react';

const translations = {
  en: {
    app: { name: 'CosmoAI', tagline: 'Turn customer feedback into product decisions' },
    nav: {
      dashboard: 'Dashboard', products: 'My Products', analysis: 'Analysis',
      comparison: 'Comparison', history: 'History',
    },
    dashboard: {
      title: 'Dashboard', subtitle: 'Your cosmetic intelligence, at a glance',
      total_reviews: 'Reviews Analyzed', sentiment_ratio: 'Positive Ratio',
      top_issue: 'Top Issue', trending: 'Trending Problem',
      health_score: 'Avg. Health Score', key_insights: 'Key Insights',
      sentiment_dist: 'Sentiment Distribution', recent_products: 'Recent Products',
      no_data: 'No data yet. Start by analyzing your first reviews.',
      positive: 'Positive', neutral: 'Neutral', negative: 'Negative',
      no_insights: 'Analyze reviews to unlock AI insights.',
    },
    products: {
      title: 'My Products', subtitle: 'Manage and monitor your cosmetic catalog',
      add: 'Add Product', new: 'New Product', edit: 'Edit Product',
      name: 'Product Name', brand: 'Brand', category: 'Category',
      description: 'Description', optional: 'optional',
      save: 'Save', cancel: 'Cancel', delete: 'Delete',
      confirm_delete: 'Delete this product? This action cannot be undone.',
      total_reviews: 'Reviews', sentiment: 'Sentiment', last_update: 'Last update',
      health: 'Health', empty: 'No products yet. Add your first product to begin.',
      back: '← Back to products', no_analyses: 'No analyses yet for this product.',
      sentiment_over_time: 'Sentiment Over Time', top_issues: 'Top Issues',
      aspect_evolution: 'Aspect Breakdown', analyses_list: 'Past Analyses',
    },
    analysis: {
      title: 'Review Analysis', subtitle: 'Paste reviews or upload a file — AI does the rest',
      select_product: 'Product', placeholder_product: 'Select a product…',
      reviews_label: 'Customer Reviews', reviews_placeholder: 'Paste reviews here, one per line…',
      upload: 'Upload CSV / Excel', analyze: 'Analyze Reviews', analyzing: 'Analyzing…',
      summary: 'Summary', aspects: 'Aspects', aspect: 'Aspect',
      sentiment: 'Sentiment', mentions: 'Mentions', recommendations: 'Recommendations',
      key_insights: 'Key Insights', err_no_product: 'Please select a product.',
      err_no_reviews: 'Please paste or upload reviews.', saved: 'Analysis saved.',
    },
    comparison: {
      title: 'Product Comparison', subtitle: 'Compare two products side by side',
      product_a: 'Product A', product_b: 'Product B', select: 'Select a product…',
      sentiment_score: 'Sentiment', health_score: 'Health', total_reviews: 'Reviews',
      top_aspects: 'Top Aspects', key_diff: 'Key Differences',
      no_data: 'Select two products to compare.', compare: 'Compare',
    },
    history: {
      title: 'History', subtitle: 'Browse past analyses and track improvements',
      filter: 'Filter by product', all: 'All products',
      empty: 'No analyses yet.', reviews: 'reviews', open: 'View',
    },
    common: { loading: 'Loading…', error: 'Something went wrong.', search: 'Search…', of: 'of' },
  },
  ar: {
    app: { name: 'CosmoAI', tagline: 'حوّل آراء العملاء إلى قرارات منتج' },
    nav: {
      dashboard: 'لوحة التحكم', products: 'منتجاتي', analysis: 'التحليل',
      comparison: 'المقارنة', history: 'السجل',
    },
    dashboard: {
      title: 'لوحة التحكم', subtitle: 'ذكاؤك التجميلي دفعةً واحدة',
      total_reviews: 'التقييمات المحللة', sentiment_ratio: 'نسبة الإيجابية',
      top_issue: 'المشكلة الرئيسية', trending: 'المشكلة المتصاعدة',
      health_score: 'متوسط درجة الصحة', key_insights: 'الرؤى الرئيسية',
      sentiment_dist: 'توزيع المشاعر', recent_products: 'المنتجات الأخيرة',
      no_data: 'لا توجد بيانات. ابدأ بتحليل أول تقييماتك.',
      positive: 'إيجابي', neutral: 'محايد', negative: 'سلبي',
      no_insights: 'حلّل التقييمات لاكتشاف رؤى الذكاء الاصطناعي.',
    },
    products: {
      title: 'منتجاتي', subtitle: 'إدارة ومتابعة الكتالوج التجميلي',
      add: 'إضافة منتج', new: 'منتج جديد', edit: 'تعديل المنتج',
      name: 'اسم المنتج', brand: 'العلامة التجارية', category: 'الفئة',
      description: 'الوصف', optional: 'اختياري',
      save: 'حفظ', cancel: 'إلغاء', delete: 'حذف',
      confirm_delete: 'هل تريد حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.',
      total_reviews: 'التقييمات', sentiment: 'المشاعر', last_update: 'آخر تحديث',
      health: 'الصحة', empty: 'لا توجد منتجات. أضف منتجك الأول للبدء.',
      back: '→ العودة إلى المنتجات', no_analyses: 'لا توجد تحليلات لهذا المنتج.',
      sentiment_over_time: 'المشاعر عبر الزمن', top_issues: 'أبرز المشكلات',
      aspect_evolution: 'تفصيل الجوانب', analyses_list: 'التحليلات السابقة',
    },
    analysis: {
      title: 'تحليل التقييمات', subtitle: 'الصق التقييمات أو ارفع ملفاً — الذكاء الاصطناعي يتكفل بالباقي',
      select_product: 'المنتج', placeholder_product: 'اختر منتجاً…',
      reviews_label: 'تقييمات العملاء', reviews_placeholder: 'الصق التقييمات هنا، واحد في كل سطر…',
      upload: 'رفع CSV / Excel', analyze: 'تحليل التقييمات', analyzing: 'جارٍ التحليل…',
      summary: 'الملخص', aspects: 'الجوانب', aspect: 'الجانب',
      sentiment: 'المشاعر', mentions: 'الإشارات', recommendations: 'التوصيات',
      key_insights: 'الرؤى الرئيسية', err_no_product: 'يرجى اختيار منتج.',
      err_no_reviews: 'يرجى لصق أو رفع التقييمات.', saved: 'تم حفظ التحليل.',
    },
    comparison: {
      title: 'مقارنة المنتجات', subtitle: 'قارن منتجين جنباً إلى جنب',
      product_a: 'المنتج أ', product_b: 'المنتج ب', select: 'اختر منتجاً…',
      sentiment_score: 'المشاعر', health_score: 'الصحة', total_reviews: 'التقييمات',
      top_aspects: 'أبرز الجوانب', key_diff: 'الفروق الرئيسية',
      no_data: 'اختر منتجين للمقارنة.', compare: 'مقارنة',
    },
    history: {
      title: 'السجل', subtitle: 'استعرض التحليلات السابقة وتتبع التحسينات',
      filter: 'تصفية حسب المنتج', all: 'جميع المنتجات',
      empty: 'لا توجد تحليلات بعد.', reviews: 'تقييمات', open: 'عرض',
    },
    common: { loading: 'جارٍ التحميل…', error: 'حدث خطأ ما.', search: 'بحث…', of: 'من' },
  },
  fr: {
    app: { name: 'CosmoAI', tagline: 'Transformez les avis clients en décisions produit' },
    nav: {
      dashboard: 'Tableau de bord', products: 'Mes produits', analysis: 'Analyse',
      comparison: 'Comparaison', history: 'Historique',
    },
    dashboard: {
      title: 'Tableau de bord', subtitle: 'Votre intelligence cosmétique, en un coup d\'œil',
      total_reviews: 'Avis analysés', sentiment_ratio: 'Ratio positif',
      top_issue: 'Problème principal', trending: 'Tendance émergente',
      health_score: 'Score santé moyen', key_insights: 'Insights clés',
      sentiment_dist: 'Répartition du sentiment', recent_products: 'Produits récents',
      no_data: 'Aucune donnée. Commencez par analyser vos premiers avis.',
      positive: 'Positif', neutral: 'Neutre', negative: 'Négatif',
      no_insights: 'Analysez des avis pour débloquer les insights IA.',
    },
    products: {
      title: 'Mes produits', subtitle: 'Gérez et suivez votre catalogue cosmétique',
      add: 'Ajouter', new: 'Nouveau produit', edit: 'Modifier',
      name: 'Nom du produit', brand: 'Marque', category: 'Catégorie',
      description: 'Description', optional: 'optionnel',
      save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer',
      confirm_delete: 'Supprimer ce produit ? Cette action est irréversible.',
      total_reviews: 'Avis', sentiment: 'Sentiment', last_update: 'Mise à jour',
      health: 'Santé', empty: 'Aucun produit. Ajoutez-en un pour commencer.',
      back: '← Retour aux produits', no_analyses: 'Aucune analyse pour ce produit.',
      sentiment_over_time: 'Sentiment dans le temps', top_issues: 'Problèmes principaux',
      aspect_evolution: 'Répartition des aspects', analyses_list: 'Analyses passées',
    },
    analysis: {
      title: 'Analyse d\'avis', subtitle: 'Collez des avis ou importez un fichier — l\'IA fait le reste',
      select_product: 'Produit', placeholder_product: 'Sélectionner un produit…',
      reviews_label: 'Avis clients', reviews_placeholder: 'Collez les avis ici, un par ligne…',
      upload: 'Importer CSV / Excel', analyze: 'Analyser', analyzing: 'Analyse en cours…',
      summary: 'Synthèse', aspects: 'Aspects', aspect: 'Aspect',
      sentiment: 'Sentiment', mentions: 'Mentions', recommendations: 'Recommandations',
      key_insights: 'Insights clés', err_no_product: 'Veuillez sélectionner un produit.',
      err_no_reviews: 'Veuillez fournir des avis.', saved: 'Analyse enregistrée.',
    },
    comparison: {
      title: 'Comparaison', subtitle: 'Comparez deux produits côte à côte',
      product_a: 'Produit A', product_b: 'Produit B', select: 'Sélectionner…',
      sentiment_score: 'Sentiment', health_score: 'Santé', total_reviews: 'Avis',
      top_aspects: 'Principaux aspects', key_diff: 'Différences clés',
      no_data: 'Sélectionnez deux produits pour comparer.', compare: 'Comparer',
    },
    history: {
      title: 'Historique', subtitle: 'Consultez les analyses passées',
      filter: 'Filtrer par produit', all: 'Tous les produits',
      empty: 'Aucune analyse.', reviews: 'avis', open: 'Voir',
    },
    common: { loading: 'Chargement…', error: 'Une erreur est survenue.', search: 'Rechercher…', of: 'sur' },
  },
};

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('cosmoai_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('cosmoai_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (path) => {
    const keys = path.split('.');
    let val = translations[lang];
    for (const k of keys) val = val?.[k];
    return typeof val === 'string' ? val : path;
  };

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
};