export interface Translations {
  // Navigation
  dashboard: string;
  statistics: string;
  myBirds: string;
  chicks: string;
  pedigree: string;
  calendar: string;
  settings: string;

  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  loading: string;
  error: string;
  success: string;
  warning: string;
  info: string;

  // Auth
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;

  // Profile
  profile: string;
  editProfile: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string;
  language: string;
  theme: string;

  // Birds
  birdName: string;
  ringNumber: string;
  species: string;
  gender: string;
  male: string;
  female: string;
  birthDate: string;
  colorMutation: string;
  notes: string;
  favorite: string;
  addBird: string;
  editBird: string;
  deleteBird: string;

  // Chicks
  chickName: string;
  hatchDate: string;
  weight: string;
  addChick: string;
  editChick: string;
  deleteChick: string;

  // Settings
  appearance: string;
  darkMode: string;
  lightMode: string;
  notifications: string;
  dailyReminders: string;
  criticalAlerts: string;
  hatchReminders: string;
  backup: string;
  autoBackup: string;
  exportData: string;
  importData: string;
  about: string;
  version: string;
  support: string;
  feedback: string;

  // Messages
  welcomeMessage: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  noDataFound: string;
  confirmDelete: string;
  operationSuccessful: string;
  operationFailed: string;
}

export const translations: Record<'tr' | 'en', Translations> = {
  tr: {
    // Navigation
    dashboard: 'Ana Sayfa',
    statistics: 'İstatistikler',
    myBirds: 'Kuşlarım',
    chicks: 'Yavrular',
    pedigree: 'Soy Ağacı',
    calendar: 'Takvim',
    settings: 'Ayarlar',

    // Common
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    add: 'Ekle',
    search: 'Ara',
    loading: 'Yükleniyor',
    error: 'Hata',
    success: 'Başarılı',
    warning: 'Uyarı',
    info: 'Bilgi',

    // Auth
    signIn: 'Giriş Yap',
    signUp: 'Kayıt Ol',
    signOut: 'Çıkış Yap',
    email: 'E-posta',
    password: 'Şifre',
    confirmPassword: 'Şifre Onayı',
    forgotPassword: 'Şifremi Unuttum',
    createAccount: 'Hesap Oluştur',
    alreadyHaveAccount: 'Zaten hesabınız var mı? Giriş yapın',
    dontHaveAccount: 'Hesabınız yok mu? Kayıt olun',

    // Profile
    profile: 'Profil',
    editProfile: 'Profil Düzenle',
    firstName: 'Ad',
    lastName: 'Soyad',
    fullName: 'Ad Soyad',
    avatar: 'Profil Fotoğrafı',
    language: 'Dil',
    theme: 'Tema',

    // Birds
    birdName: 'Kuş Adı',
    ringNumber: 'Bilezik Numarası',
    species: 'Tür',
    gender: 'Cinsiyet',
    male: 'Erkek',
    female: 'Dişi',
    birthDate: 'Doğum Tarihi',
    colorMutation: 'Renk Mutasyonu',
    notes: 'Notlar',
    favorite: 'Favori',
    addBird: 'Kuş Ekle',
    editBird: 'Kuş Düzenle',
    deleteBird: 'Kuş Sil',

    // Incubation
    incubationTracking: 'Kuluçka Takibi',
    nestName: 'Yuva Adı',
    startDate: 'Başlangıç Tarihi',
    expectedHatchDate: 'Tahmini Çıkım Tarihi',
    actualHatchDate: 'Gerçek Çıkım Tarihi',
    eggCount: 'Yumurta Sayısı',
    successRate: 'Başarı Oranı',
    status: 'Durum',
    active: 'Aktif',
    completed: 'Tamamlandı',
    failed: 'Başarısız',

    // Chicks
    chickName: 'Yavru Adı',
    hatchDate: 'Çıkım Tarihi',
    weight: 'Ağırlık',
    addChick: 'Yavru Ekle',
    editChick: 'Yavru Düzenle',
    deleteChick: 'Yavru Sil',

    // Settings
    appearance: 'Görünüm',
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
    notifications: 'Bildirimler',
    dailyReminders: 'Günlük Hatırlatmalar',
    criticalAlerts: 'Kritik Uyarılar',
    hatchReminders: 'Çıkım Hatırlatmaları',
    backup: 'Yedekleme',
    autoBackup: 'Otomatik Yedekleme',
    exportData: 'Verileri Dışa Aktar',
    importData: 'Verileri İçe Aktar',
    about: 'Hakkında',
    version: 'Sürüm',
    support: 'Destek',
    feedback: 'Geri Bildirim',

    // Messages
    welcomeMessage: 'Kuluçka takibinize hoş geldiniz',
    goodMorning: 'Günaydın',
    goodAfternoon: 'İyi günler',
    goodEvening: 'İyi akşamlar',
    noDataFound: 'Veri bulunamadı',
    confirmDelete: 'Silmek istediğinizden emin misiniz?',
    operationSuccessful: 'İşlem başarıyla tamamlandı',
    operationFailed: 'İşlem başarısız oldu',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    statistics: 'Statistics',
    myBirds: 'My Birds',
    chicks: 'Chicks',
    pedigree: 'Pedigree',
    calendar: 'Calendar',
    settings: 'Settings',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',

    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account? Sign in',
    dontHaveAccount: 'Don\'t have an account? Sign up',

    // Profile
    profile: 'Profile',
    editProfile: 'Edit Profile',
    firstName: 'First Name',
    lastName: 'Last Name',
    fullName: 'Full Name',
    avatar: 'Profile Picture',
    language: 'Language',
    theme: 'Theme',

    // Birds
    birdName: 'Bird Name',
    ringNumber: 'Ring Number',
    species: 'Species',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    birthDate: 'Birth Date',
    colorMutation: 'Color Mutation',
    notes: 'Notes',
    favorite: 'Favorite',
    addBird: 'Add Bird',
    editBird: 'Edit Bird',
    deleteBird: 'Delete Bird',

    // Incubation
    incubationTracking: 'Incubation Tracking',
    nestName: 'Nest Name',
    startDate: 'Start Date',
    expectedHatchDate: 'Expected Hatch Date',
    actualHatchDate: 'Actual Hatch Date',
    eggCount: 'Egg Count',
    successRate: 'Success Rate',
    status: 'Status',
    active: 'Active',
    completed: 'Completed',
    failed: 'Failed',

    // Chicks
    chickName: 'Chick Name',
    hatchDate: 'Hatch Date',
    weight: 'Weight',
    addChick: 'Add Chick',
    editChick: 'Edit Chick',
    deleteChick: 'Delete Chick',

    // Settings
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    notifications: 'Notifications',
    dailyReminders: 'Daily Reminders',
    criticalAlerts: 'Critical Alerts',
    hatchReminders: 'Hatch Reminders',
    backup: 'Backup',
    autoBackup: 'Auto Backup',
    exportData: 'Export Data',
    importData: 'Import Data',
    about: 'About',
    version: 'Version',
    support: 'Support',
    feedback: 'Feedback',

    // Messages
    welcomeMessage: 'Welcome to your incubation tracking',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    noDataFound: 'No data found',
    confirmDelete: 'Are you sure you want to delete?',
    operationSuccessful: 'Operation completed successfully',
    operationFailed: 'Operation failed',
  },
};

export const useTranslation = (language: 'tr' | 'en' = 'tr') => {
  return translations[language];
};