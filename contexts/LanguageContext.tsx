import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

type Translations = {
  [key: string]: string;
};

const translations: Record<Language, Translations> = {
  en: {
    // App Header & Footer
    app_title: 'GHOSTPRESS',
    app_subtitle: 'Zero-Trust Compression',
    loading_core: 'LOADING CORE...',
    wasm_ready: 'WASM ENGINE READY',
    sim_mode: '(SIM)',
    footer_text: 'GhostPress v1.0.0 // Client-Side Operations // 0KB Uploaded',
    
    // Privacy Shield
    privacy_active: 'Privacy Shield Active',
    offline_mode: 'Offline Mode Engaged',
    
    // Workbench
    workbench_title: 'WORKBENCH',
    workbench_desc: 'Import files to the secure enclave. All processing happens locally within your browser\'s WebAssembly container.',
    stat_total_files: 'Total Files',
    stat_savings: 'Savings',
    queue_manifest: 'QUEUE_MANIFEST',
    btn_clear_all: 'Clear All',
    btn_init_all: 'Initialize All',
    
    // DropZone
    drop_release: 'RELEASE PAYLOAD',
    drop_initiate: 'INITIATE TRANSFER',
    drop_desc: 'Drag & Drop files or click to browse.',
    drop_support: 'Supports MP4, MOV, MKV, JPG, PNG, WEBP (Unlimited Size)',
    
    // Visualizer
    vis_binary: 'BINARY_STREAM',
    vis_compressed: 'COMPRESSED',
    vis_hydraulic: 'HYDRAULIC',
    
    // File Item
    status_idle: 'IDLE',
    status_queued: 'QUEUED',
    status_compressing: 'COMPRESSING',
    status_completed: 'COMPLETED',
    status_error: 'ERROR',
    
    processing_chunk: 'PROCESSING_CHUNK_DATA...',
    btn_compare: 'Compare',
    btn_save: 'Save',
    btn_init: 'Initialize',
    
    // Settings
    label_quality: 'Quality Level',
    label_max_compress: 'Max Compression',
    label_max_quality: 'Max Quality',
    label_metadata: 'Metadata Stripping',
    btn_meta_enabled: 'ENABLED (PRIVACY MODE)',
    btn_meta_disabled: 'DISABLED (PRESERVE EXIF)',
    label_format: 'Format',
    opt_original: 'Original (Preserve)',
    
    // Comparison View
    comp_title: 'VISUAL_ANALYSIS_UNIT',
    comp_video_msg: 'Video comparison not supported in this view. Use preview.',
    comp_original: 'ORIGINAL',
    comp_compressed: 'COMPRESSED',
  },
  zh: {
    // App Header & Footer
    app_title: 'GHOSTPRESS',
    app_subtitle: '零信任压缩',
    loading_core: '核心加载中...',
    wasm_ready: 'WASM 引擎就绪',
    sim_mode: '(模拟)',
    footer_text: 'GhostPress v1.0.0 // 客户端操作 // 0KB 上传',
    
    // Privacy Shield
    privacy_active: '隐私盾已激活',
    offline_mode: '离线模式已启动',
    
    // Workbench
    workbench_title: '工作台',
    workbench_desc: '将文件导入安全飞地。所有处理都在浏览器 WebAssembly 容器内本地进行。',
    stat_total_files: '文件总数',
    stat_savings: '节省空间',
    queue_manifest: '队列清单',
    btn_clear_all: '清空全部',
    btn_init_all: '全部初始化',
    
    // DropZone
    drop_release: '释放载荷',
    drop_initiate: '启动传输',
    drop_desc: '拖放文件或点击浏览',
    drop_support: '支持 MP4, MOV, MKV, JPG, PNG, WEBP (无大小限制)',
    
    // Visualizer
    vis_binary: '二进制流',
    vis_compressed: '已压缩',
    vis_hydraulic: '液压',
    
    // File Item
    status_idle: '空闲',
    status_queued: '已排队',
    status_compressing: '压缩中',
    status_completed: '已完成',
    status_error: '错误',
    
    processing_chunk: '处理数据块...',
    btn_compare: '对比',
    btn_save: '保存',
    btn_init: '初始化',
    
    // Settings
    label_quality: '质量等级',
    label_max_compress: '最大压缩',
    label_max_quality: '最高画质',
    label_metadata: '元数据剥离',
    btn_meta_enabled: '已启用 (隐私模式)',
    btn_meta_disabled: '已禁用 (保留 EXIF)',
    label_format: '格式',
    opt_original: '原始 (保留)',
    
    // Comparison View
    comp_title: '视觉分析单元',
    comp_video_msg: '此视图不支持视频对比，请使用预览。',
    comp_original: '原始',
    comp_compressed: '压缩后',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};