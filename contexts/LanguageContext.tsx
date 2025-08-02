import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const translations = {
  en: {
    // App Title
    appTitle: 'Mero Hisab',
    appSubtitle: 'Compound interest yearly, simple monthly, daily compound for remaining days',
    
    // Home Screen
    financialTools: 'Financial Tools for Nepali Businessman',
    chooseFeature: 'Choose a Feature',
    calculateInterestDesc: 'Calculate compound interest with BS dates',
    trackLoansDesc: 'Track loans given or taken with automatic calculations',
    quickAccess: 'Quick Access',
    trackLoans: 'Track LenDen',
    
    // Form Labels
    principalAmount: 'Principal Amount',
    monthlyInterestRate: 'Monthly Interest Rate',
    startDate: 'Start Date (BS)',
    endDate: 'End Date (BS)',
    
    // Buttons
    calculate: 'Calculate',
    reset: 'Reset',
    confirm: 'Confirm',
    cancel: 'Cancel',
    backToCalculator: 'Back to Calculator',
    
    // Results
    calculationResults: 'Calculation Results',
    timePeriod: 'Time Period',
    totalDays: 'Total Days',
    principalAmountResult: 'Principal Amount',
    totalInterest: 'Total Interest',
    finalAmount: 'Final Amount',
    interestBreakdown: 'Interest Breakdown',
    calculationBreakdown: 'Calculation Breakdown',
    
    // Time units
    year: 'year',
    years: 'years',
    month: 'month',
    months: 'months',
    day: 'day',
    days: 'days',
    calendarDays: 'calendar days',
    
    // Interest types
    yearlyInterest: 'Yearly Interest',
    monthlyInterest: 'Monthly Interest',
    dailyInterest: 'Daily Interest',
    
    // Date picker
    selectBSDate: 'Select BS Date',
    
    // Months
    baishakh: 'Baishakh',
    jestha: 'Jestha',
    ashadh: 'Ashadh',
    shrawan: 'Shrawan',
    bhadra: 'Bhadra',
    ashwin: 'Ashwin',
    kartik: 'Kartik',
    mangsir: 'Mangsir',
    poush: 'Poush',
    magh: 'Magh',
    falgun: 'Falgun',
    chaitra: 'Chaitra',
    
    // Errors
    enterValidAmount: 'Please enter a valid amount',
    enterValidRate: 'Please enter a valid rate',
    invalidStartDate: 'Invalid start date',
    invalidEndDate: 'Invalid end date',
    endDateAfterStart: 'End date must be after start date',
    enterPersonName: 'Please enter person name',
    invalidLoanDate: 'Invalid loan date',
    loanDateFuture: 'Loan date cannot be in the future',
    enterValidRepaymentAmount: 'Please enter valid repayment amount',
    invalidRepaymentDate: 'Invalid repayment date',
    repaymentDateAfterLoan: 'Repayment date must be after loan date',
    repaymentDateFuture: 'Repayment date cannot be in the future',
    repaymentExceedsLoan: 'Repayment amount cannot exceed loan amount',
    totalRepaymentExceedsLoan: 'Total repayment amount cannot exceed loan amount',
    
    // Navigation
    calculator: 'Gramin Interest Calculator',
    settings: 'Settings',
    
    // Karobar
    karobar: 'Repayment Interest Calculator',
    karobarSubtitle: 'Track loans with automatic BS calendar calculation',
    personName: 'Person Name',
    enterPersonNamePlaceholder: 'Enter person\'s name',
    loanAmount: 'Loan Amount',
    loanType: 'Loan Type',
    loanGiven: 'Given (Diyeko)',
    loanTaken: 'Taken (Liyeko)',
    loanDate: 'Loan Date (BS)',
    partialRepayment: 'Partial Repayment',
    hasRepayment: 'Has there been any repayment?',
    repaymentDetails: 'Repayments Amounts (Till Today)',
    repaymentAmount: 'Repayment Amount',
    repaymentDate: 'Repayment Date (BS)',
    
    // Karobar Results
    karobarResults: 'Repayment Interest Results',
    moneyGiven: 'Money Given (Diyeko)',
    moneyTaken: 'Money Taken (Liyeko)',
    originalAmountDue: 'Original Amount Due (Till Today)',
    originalAmount: 'Original Amount',
    interestRate: 'Interest Rate',
    totalAmountDue: 'Total Amount Due',
    repaymentDateLabel: 'Repayment Date',
    repaidAmount: 'Repaid Amount',
    timePeriodRepayment: 'Time Period (Repayment to Today)',
    daysRepayment: 'Days (Repayment to Today)',
    interestOnRepayment: 'Interest on Repaid Amount',
    totalRepaymentValue: 'Total Repayment Value',
    netBalanceTillToday: 'Net Balance (Till Today)',
    lessRepayment: 'Less: Repayment + Interest',
    netAmountReceive: 'Net Amount to Receive',
    netAmountPay: 'Net Amount to Pay',
    overpaidBy: 'Overpaid by',
    backToKarobar: 'Back to Business',
    perMonth: 'per month',
    totalRepaidAmount: 'Total Repaid Amount',
    totalInterestOnRepayments: 'Total Interest on Repayments',
    
    // Settings
    language: 'Language',
    english: 'English',
    nepali: 'नेपाली',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    aboutApp: 'About App',
    version: 'Version',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    systemMode: 'System Default',
    selectLanguage: 'Select Language',
    selectTheme: 'Select Theme',
    
    // Calculation note
    calculationNote: 'Interest compounded annually for',
    calculationNoteTitle: 'Calculation Note',
    simpleInterestFor: 'simple interest for',
    simpleDailyInterestFor: 'simple daily interest for',
    
    // Privacy Policy
    privacyPolicyTitle: 'Privacy Policy',
    privacyPolicyContent: `Last updated: January 2025

This Privacy Policy describes how Mero Hisab ("we", "our", or "us") collects, uses, and protects your information when you use our mobile application.

INFORMATION WE COLLECT
We do not collect any personal information from users. All calculations are performed locally on your device.

DATA STORAGE
- All your calculation data is stored locally on your device
- We do not transmit any data to external servers
- Your calculation history and preferences remain private

THIRD-PARTY SERVICES
Our app does not integrate with any third-party analytics or advertising services.

CHILDREN'S PRIVACY
Our app is suitable for all ages and does not collect any personal information from children or adults.

CHANGES TO PRIVACY POLICY
We may update this Privacy Policy from time to time. Any changes will be posted within the app.

CONTACT US
If you have questions about this Privacy Policy, please contact us through the App Store.`,
    
    // Terms of Service
    termsOfServiceTitle: 'Terms of Service',
    termsOfServiceContent: `Last updated: January 2025

ACCEPTANCE OF TERMS
By using Mero Hisab, you agree to these Terms of Service.

USE OF THE APP
- This app is provided for educational and calculation purposes
- All calculations are estimates and should not be considered as financial advice
- Users are responsible for verifying calculations independently
- The app uses Nepali Bikram Sambat calendar system

ACCURACY DISCLAIMER
While we strive for accuracy, we do not guarantee that all calculations are error-free. Users should verify important calculations independently.

LIMITATION OF LIABILITY
The app is provided "as is" without warranties. We are not liable for any damages arising from the use of this app.

INTELLECTUAL PROPERTY
The app and its content are protected by copyright and other intellectual property laws.

MODIFICATIONS
We reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.

GOVERNING LAW
These terms are governed by applicable laws.

CONTACT
For questions about these terms, please contact us through the App Store.`,
    
    // Call to Action
    readyToGetStarted: 'Ready to get started?',
    joinThousandsOfUsers: 'Join thousands of users managing their finances with ease',
    
    // Auth
    accessBusinessDashboard: 'Access Your Business Dashboard',
    
    // Dashboard Header
    namaste: 'Namaste!',
    totalBalance: 'Total Balance',
    netToReceive: 'Net to receive',
    netToGive: 'Net to give',
    allSettled: 'All settled',
    
    // Customer Tab
    yourCustomers: 'Your customers',
    customerFound: 'Customer found',
    customersFound: 'Customers found',
    
    // Dashboard
    welcomeBack: 'Namaste!',
    customers: 'Customers',
    active: 'Active',
    amountYoullReceive: 'Amount you\'ll receive',
    amountYouOwe: 'Amount you owe',
    searchCustomers: 'Search customers...',
    addCustomer: 'Add Customer',
    noMatchesFound: 'No matches found',
    noCustomersYet: 'No customers yet',
    noCustomersFoundMatching: 'No customers found matching',
    tryDifferentSearchTerm: 'Try a different search term.',
    addFirstCustomerDesc: 'Add your first customer to start tracking loans and payments.',
    addFirstCustomer: 'Add First Customer',
    transaction: 'transaction',
    transactions: 'transactions',
    call: 'Call',
    add: 'Add',
    
    // Footer/Tab Bar
    home: 'Home',
    
    // Balance Display
    netBalance: 'Net Balance',
    toReceive: 'TO RECEIVE',
    toGive: 'TO GIVE',
    
    // Statement Page
    activeCustomer: 'Active Customer',
    transactionHistory: 'Transaction History',
    tapEditButton: 'Tap the "Edit" button on any transaction to modify or delete it',
    youReceived: 'You Received',
    youGave: 'You Gave',
    noTransactionsYet: 'No transactions yet',
    startAddingTransactions: 'Start adding transactions with',
    toSeeThemHere: 'to see them here',
    youGotRs: 'YOU GOT रु',
    youGaveRs: 'YOU GAVE रु',
    
    // Entry Pages
    addReceiveEntry: 'Add Receive Entry',
    editReceiveEntry: 'Edit Receive Entry',
    addGiveEntry: 'Add Give Entry',
    editGiveEntry: 'Edit Give Entry',
    recordAmountToReceive: 'Record amount to receive from',
    editAmountToReceive: 'Edit amount to receive from',
    recordAmountToGive: 'Record amount to give to',
    editAmountToGive: 'Edit amount to give to',
    customerName: 'Customer Name',
    amountToReceive: 'Amount to Receive',
    amountToGive: 'Amount to Give',
    transactionDate: 'Transaction Date',
    descriptionItemsNotes: 'Description / Items / Notes',
    enterItemDetails: 'Enter item details, notes, or description',
    thisFieldCannotBeChanged: 'This field cannot be changed',
    entry: 'Entry',
    addAnotherEntry: 'Add Another Entry',
    savingEntries: 'Saving Entries...',
    updatingEntry: 'Updating Entry...',
    updateEntry: 'Update Entry',
    saveEntry: 'Save Entry',
    saveEntries: 'Save Entries',
    deleteEntry: 'Delete Entry',
    deleteEntryConfirm: 'Are you sure you want to delete this transaction entry? This action cannot be undone.',
    entryUpdatedSuccessfully: 'Entry updated successfully',
    entryDeletedSuccessfully: 'Entry deleted successfully',
    failedToSaveEntry: 'Failed to save entry. Please try again.',
    failedToDeleteEntry: 'Failed to delete entry. Please try again.',
    amountIsRequired: 'Amount is required',
    pleaseEnterValidAmount: 'Please enter a valid amount',
    youMustBeLoggedIn: 'You must be logged in to save entries',
    missingRequiredInformation: 'Missing required information to update entry',
    success: 'Success',
    error: 'Error',
    ok: 'OK',
    
    // Customer Form
    editCustomer: 'Edit Customer',
    addCustomerForm: 'Add Customer',
    updateCustomerDetails: 'Update customer details below',
    enterCustomerDetails: 'Enter customer details below',
    customerNameForm: 'Customer Name',
    enterCustomerName: 'Enter customer name',
    phoneNumberOptional: 'Phone Number (Optional)',
    mobileNumber: 'Mobile Number',
    updateCustomer: 'UPDATE CUSTOMER',
    saveCustomer: 'SAVE CUSTOMER',
    saving: 'Saving...',
    chooseFromContactsOrAddManually: 'Choose from contacts or add manually',
    searchContacts: 'Search Contacts',
    customerNameSearch: 'Customer name',
    loadingContacts: 'Loading contacts...',
    contactsAvailable: 'contacts available',
    yourContacts: 'Your Contacts',
    accessYourContacts: 'Access Your Contacts',
    grantPermissionToQuicklyAdd: 'Grant permission to quickly add customers from your phone contacts.',
    grantPermission: 'Grant Permission',
    onDesktopYouCanManually: '💡 On desktop, you can manually enter customer names above. Contact access is available on mobile devices.',
    noContactsFoundMatching: 'No contacts found matching',
    noContactsAvailable: 'No contacts available',
    
    // About
    aboutContent: `Mero Hisab is a specialized tool for calculating compound interest using the Nepali Bikram Sambat calendar system.

Features:
• Accurate BS date calculations
• Compound interest yearly
• Simple interest for months and days
• Support for BS years 2070-2084
• Bilingual support (English/Nepali)
• Dark/Light mode support
• Offline calculations
• No data collection

The app follows a specific calculation methodology:
- Compound interest applied yearly on principal
- Simple interest for remaining months
- Simple daily interest for remaining days

This app is perfect for financial planning, loan calculations, and investment projections using the Nepali calendar system.`
  },
  ne: {
    // App Title
    appTitle: 'मेरो हिसाब',
    appSubtitle: 'वार्षिक चक्रवृद्धि ब्याज, मासिक साधारण ब्याज, बाँकी दिनहरूको लागि दैनिक चक्रवृद्धि',
    
    // Home Screen
    financialTools: 'नेपाली व्यापारीका लागि वित्तीय उपकरणहरू',
    chooseFeature: 'सुविधा छान्नुहोस्',
    calculateInterestDesc: 'बि.स. मितिहरूसँग चक्रवृद्धि ब्याज गणना गर्नुहोस्',
    trackLoansDesc: 'स्वचालित गणनासहित दिएको वा लिएको ऋण ट्र्याक गर्नुहोस्',
    quickAccess: 'द्रुत पहुँच',
    trackLoans: 'लेनदेन ट्र्याक गर्नुहोस्',
    
    // Form Labels
    principalAmount: 'मूल रकम',
    monthlyInterestRate: 'मासिक ब्याज दर',
    startDate: 'सुरु मिति (बि.स.)',
    endDate: 'अन्त्य मिति (बि.स.)',
    
    // Buttons
    calculate: 'गणना गर्नुहोस्',
    reset: 'रिसेट',
    confirm: 'पुष्टि गर्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    backToCalculator: 'क्यालकुलेटरमा फर्कनुहोस्',
    
    // Results
    calculationResults: 'गणनाको नतिजा',
    timePeriod: 'समय अवधि',
    totalDays: 'कुल दिनहरू',
    principalAmountResult: 'मूल रकम',
    totalInterest: 'कुल ब्याज',
    finalAmount: 'अन्तिम रकम',
    interestBreakdown: 'ब्याजको विवरण',
    calculationBreakdown: 'गणना विवरण',
    
    // Time units
    year: 'वर्ष',
    years: 'वर्षहरू',
    month: 'महिना',
    months: 'महिनाहरू',
    day: 'दिन',
    days: 'दिनहरू',
    calendarDays: 'क्यालेन्डर दिनहरू',
    
    // Interest types
    yearlyInterest: 'वार्षिक ब्याज',
    monthlyInterest: 'मासिक ब्याज',
    dailyInterest: 'दैनिक ब्याज',
    
    // Date picker
    selectBSDate: 'बि.स. मिति छान्नुहोस्',
    
    // Months
    baishakh: 'बैशाख',
    jestha: 'जेठ',
    ashadh: 'आषाढ',
    shrawan: 'श्रावण',
    bhadra: 'भाद्र',
    ashwin: 'आश्विन',
    kartik: 'कार्तिक',
    mangsir: 'मंसिर',
    poush: 'पुष',
    magh: 'माघ',
    falgun: 'फाल्गुन',
    chaitra: 'चैत्र',
    
    // Errors
    enterValidAmount: 'कृपया मान्य रकम प्रविष्ट गर्नुहोस्',
    enterValidRate: 'कृपया मान्य दर प्रविष्ट गर्नुहोस्',
    invalidStartDate: 'अमान्य सुरु मिति',
    invalidEndDate: 'अमान्य अन्त्य मिति',
    endDateAfterStart: 'अन्त्य मिति सुरु मिति पछि हुनुपर्छ',
    enterPersonName: 'कृपया व्यक्तिको नाम प्रविष्ट गर्नुहोस्',
    invalidLoanDate: 'अमान्य ऋण मिति',
    loanDateFuture: 'ऋण मिति भविष्यमा हुन सक्दैन',
    enterValidRepaymentAmount: 'कृपया मान्य फिर्ता रकम प्रविष्ट गर्नुहोस्',
    invalidRepaymentDate: 'अमान्य फिर्ता मिति',
    repaymentDateAfterLoan: 'फिर्ता मिति ऋण मिति पछि हुनुपर्छ',
    repaymentDateFuture: 'फिर्ता मिति भविष्यमा हुन सक्दैन',
    repaymentExceedsLoan: 'फिर्ता रकम ऋण रकम भन्दा बढी हुन सक्दैन',
    totalRepaymentExceedsLoan: 'कुल फिर्ता रकम ऋण रकम भन्दा बढी हुन सक्दैन',
    
    // Navigation
    calculator: 'ग्रामीण ब्याज क्यालकुलेटर',
    settings: 'सेटिङ',
    
    // Karobar
    karobar: 'फिर्ता ब्याज क्यालकुलेटर',
    karobarSubtitle: 'स्वचालित बि.स. क्यालेन्डर गणनासहित ऋण ट्र्याक गर्नुहोस्',
    personName: 'व्यक्तिको नाम',
    enterPersonNamePlaceholder: 'व्यक्तिको नाम प्रविष्ट गर्नुहोस्',
    loanAmount: 'ऋण रकम',
    loanType: 'ऋणको प्रकार',
    loanGiven: 'दिएको',
    loanTaken: 'लिएको',
    loanDate: 'ऋण मिति (बि.स.)',
    partialRepayment: 'आंशिक फिर्ता',
    hasRepayment: 'के कुनै फिर्ता भएको छ?',
    repaymentDetails: 'फिर्ता रकम (आजसम्म)',
    repaymentAmount: 'फिर्ता रकम',
    repaymentDate: 'फिर्ता मिति (बि.स.)',
    
    // Karobar Results
    karobarResults: 'फिर्ता ब्याजको नतिजा',
    moneyGiven: 'दिएको पैसा',
    moneyTaken: 'लिएको पैसा',
    originalAmountDue: 'मूल बक्यौता रकम (आजसम्म)',
    originalAmount: 'मूल रकम',
    interestRate: 'ब्याज दर',
    totalAmountDue: 'कुल बक्यौता रकम',
    repaymentDateLabel: 'फिर्ता मिति',
    repaidAmount: 'फिर्ता रकम',
    timePeriodRepayment: 'समय अवधि (फिर्ता देखि आजसम्म)',
    daysRepayment: 'दिनहरू (फिर्ता देखि आजसम्म)',
    interestOnRepayment: 'फिर्ता रकममा ब्याज',
    totalRepaymentValue: 'कुल फिर्ता मूल्य',
    netBalanceTillToday: 'नेट ब्यालेन्स (आजसम्म)',
    lessRepayment: 'घटाउनुहोस्: फिर्ता + ब्याज',
    netAmountReceive: 'प्राप्त गर्नुपर्ने नेट रकम',
    netAmountPay: 'तिर्नुपर्ने नेट रकम',
    overpaidBy: 'बढी तिरेको',
    backToKarobar: 'कारोबारमा फर्कनुहोस्',
    perMonth: 'प्रति महिना',
    totalRepaidAmount: 'कुल फिर्ता रकम',
    totalInterestOnRepayments: 'फिर्ता रकमहरूमा कुल ब्याज',
    
    // Settings
    language: 'भाषा',
    english: 'English',
    nepali: 'नेपाली',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवाका सर्तहरू',
    aboutApp: 'एपको बारेमा',
    version: 'संस्करण',
    theme: 'थिम',
    lightMode: 'उज्यालो मोड',
    darkMode: 'अँध्यारो मोड',
    systemMode: 'सिस्टम डिफल्ट',
    selectLanguage: 'भाषा छान्नुहोस्',
    selectTheme: 'थिम छान्नुहोस्',
    
    // Calculation note
    calculationNote: 'को लागि वार्षिक चक्रवृद्धि ब्याज',
    calculationNoteTitle: 'गणना नोट',
    simpleInterestFor: 'को लागि साधारण ब्याज',
    simpleDailyInterestFor: 'को लागि साधारण दैनिक ब्याज',
    
    // Privacy Policy
    privacyPolicyTitle: 'गोपनीयता नीति',
    privacyPolicyContent: `अन्तिम अपडेट: जनवरी २०२५

यो गोपनीयता नीतिले मेरो हिसाब ("हामी", "हाम्रो", वा "हामीलाई") ले तपाईंको जानकारी कसरी सङ्कलन, प्रयोग र सुरक्षा गर्छ भन्ने कुराको वर्णन गर्दछ।

हामीले सङ्कलन गर्ने जानकारी
हामी प्रयोगकर्ताहरूबाट कुनै व्यक्तिगत जानकारी सङ्कलन गर्दैनौं। सबै गणनाहरू तपाईंको यन्त्रमा स्थानीय रूपमा गरिन्छ।

डेटा भण्डारण
- तपाईंका सबै गणना डेटा तपाईंको यन्त्रमा स्थानीय रूपमा भण्डारण गरिन्छ
- हामी कुनै डेटा बाह्य सर्भरहरूमा पठाउँदैनौं
- तपाईंको गणना इतिहास र प्राथमिकताहरू निजी रहन्छन्

तेस्रो-पक्षीय सेवाहरू
हाम्रो एपले कुनै तेस्रो-पक्षीय विश्लेषण वा विज्ञापन सेवाहरूसँग एकीकरण गर्दैन।

बालबालिकाको गोपनीयता
हाम्रो एप सबै उमेरका लागि उपयुक्त छ र बालबालिका वा वयस्कहरूबाट कुनै व्यक्तिगत जानकारी सङ्कलन गर्दैन।

गोपनीयता नीतिमा परिवर्तनहरू
हामी समय-समयमा यो गोपनीयता नीति अपडेट गर्न सक्छौं। कुनै परिवर्तनहरू एप भित्र पोस्ट गरिनेछ।

हामीलाई सम्पर्क गर्नुहोस्
यदि तपाईंसँग यो गोपनीयता नीतिको बारेमा प्रश्नहरू छन् भने, कृपया एप स्टोर मार्फत हामीलाई सम्पर्क गर्नुहोस्।`,
    
    // Terms of Service
    termsOfServiceTitle: 'सेवाका सर्तहरू',
    termsOfServiceContent: `अन्तिम अपडेट: जनवरी २०२५

सर्तहरूको स्वीकृति
मेरो हिसाब प्रयोग गरेर, तपाईं यी सेवाका सर्तहरूमा सहमत हुनुहुन्छ।

एपको प्रयोग
- यो एप शैक्षिक र गणना उद्देश्यका लागि प्रदान गरिएको छ
- सबै गणनाहरू अनुमानित छन् र वित्तीय सल्लाहको रूपमा मानिनु हुँदैन
- प्रयोगकर्ताहरू स्वतन्त्र रूपमा गणनाहरू प्रमाणित गर्न जिम्मेवार छन्
- एपले नेपाली विक्रम संवत् क्यालेन्डर प्रणाली प्रयोग गर्छ

शुद्धताको अस्वीकरण
हामी शुद्धताको लागि प्रयास गर्छौं, तर सबै गणनाहरू त्रुटि-रहित छन् भन्ने ग्यारेन्टी गर्दैनौं। प्रयोगकर्ताहरूले महत्वपूर्ण गणनाहरू स्वतन्त्र रूपमा प्रमाणित गर्नुपर्छ।

दायित्वको सीमा
एप "जस्तै छ" वारेन्टी बिना प्रदान गरिएको छ। यो एपको प्रयोगबाट उत्पन्न हुने कुनै क्षतिको लागि हामी जिम्मेवार छैनौं।

बौद्धिक सम्पत्ति
एप र यसको सामग्री प्रतिलिपि अधिकार र अन्य बौद्धिक सम्पत्ति कानूनहरूद्वारा सुरक्षित छ।

परिमार्जनहरू
हामी कुनै पनि समयमा यी सर्तहरू परिमार्जन गर्ने अधिकार सुरक्षित राख्छौं। निरन्तर प्रयोगले परिमार्जित सर्तहरूको स्वीकृतिलाई जनाउँछ।

शासक कानून
यी सर्तहरू लागू कानूनहरूद्वारा शासित छन्।

सम्पर्क
यी सर्तहरूको बारेमा प्रश्नहरूको लागि, कृपया एप स्टोर मार्फत हामीलाई सम्पर्क गर्नुहोस्।`,
    
    // Call to Action
    readyToGetStarted: 'सुरु गर्न तयार हुनुहुन्छ?',
    joinThousandsOfUsers: 'सजिलैसँग आफ्नो वित्त व्यवस्थापन गर्ने हजारौं प्रयोगकर्ताहरूसँग सामेल हुनुहोस्',
    
    // Auth
    accessBusinessDashboard: 'तपाईंको व्यापार ड्यासबोर्ड पहुँच गर्नुहोस्',
    
    // Dashboard Header
    namaste: 'नमस्ते!',
    totalBalance: 'कुल ब्यालेन्स',
    netToReceive: 'प्राप्त गर्नुपर्ने',
    netToGive: 'तिर्नुपर्ने',
    allSettled: 'सबै मिलाइएको',
    
    // Customer Tab
    yourCustomers: 'तपाईंका ग्राहकहरू',
    customerFound: 'ग्राहक फेला पर्यो',
    customersFound: 'ग्राहकहरू फेला परे',
    
    // Dashboard
    welcomeBack: 'नमस्ते!',
    customers: 'ग्राहकहरू',
    active: 'सक्रिय',
    amountYoullReceive: 'तपाईंले प्राप्त गर्नुहुने रकम',
    amountYouOwe: 'तपाईंले तिर्नुपर्ने रकम',
    searchCustomers: 'ग्राहकहरू खोज्नुहोस्...',
    addCustomer: 'ग्राहक थप्नुहोस्',
    noMatchesFound: 'कुनै मिल्दो फेला परेन',
    noCustomersYet: 'अहिलेसम्म कुनै ग्राहक छैन',
    noCustomersFoundMatching: 'कुनै ग्राहक फेला परेन',
    tryDifferentSearchTerm: 'फरक खोज शब्द प्रयोग गर्नुहोस्।',
    addFirstCustomerDesc: 'ऋण र भुक्तानी ट्र्याक गर्न सुरु गर्न आफ्नो पहिलो ग्राहक थप्नुहोस्।',
    addFirstCustomer: 'पहिलो ग्राहक थप्नुहोस्',
    transaction: 'लेनदेन',
    transactions: 'लेनदेनहरू',
    call: 'कल',
    add: 'थप्नुहोस्',
    
    // Footer/Tab Bar
    home: 'होम',
    
    // Balance Display
    netBalance: 'नेट ब्यालेन्स',
    toReceive: 'प्राप्त गर्नुपर्ने',
    toGive: 'तिर्नुपर्ने',
    
    // Statement Page
    activeCustomer: 'सक्रिय ग्राहक',
    transactionHistory: 'लेनदेन इतिहास',
    tapEditButton: 'कुनै पनि लेनदेनलाई परिमार्जन वा मेटाउन "सम्पादन" बटनमा ट्याप गर्नुहोस्',
    youReceived: 'तपाईंले प्राप्त गर्नुभयो',
    youGave: 'तपाईंले दिनुभयो',
    noTransactionsYet: 'अहिलेसम्म कुनै लेनदेन छैन',
    startAddingTransactions: 'सँग लेनदेन थप्न सुरु गर्नुहोस्',
    toSeeThemHere: 'तिनीहरूलाई यहाँ हेर्न',
    youGotRs: 'तपाईंले पाउनुभयो रु',
    youGaveRs: 'तपाईंले दिनुभयो रु',
    
    // Entry Pages
    addReceiveEntry: 'प्राप्ति प्रविष्टि थप्नुहोस्',
    editReceiveEntry: 'प्राप्ति प्रविष्टि सम्पादन गर्नुहोस्',
    addGiveEntry: 'दिने प्रविष्टि थप्नुहोस्',
    editGiveEntry: 'दिने प्रविष्टि सम्पादन गर्नुहोस्',
    recordAmountToReceive: 'बाट प्राप्त गर्नुपर्ने रकम रेकर्ड गर्नुहोस्',
    editAmountToReceive: 'बाट प्राप्त गर्नुपर्ने रकम सम्पादन गर्नुहोस्',
    recordAmountToGive: 'लाई दिनुपर्ने रकम रेकर्ड गर्नुहोस्',
    editAmountToGive: 'लाई दिनुपर्ने रकम सम्पादन गर्नुहोस्',
    customerName: 'ग्राहकको नाम',
    amountToReceive: 'प्राप्त गर्नुपर्ने रकम',
    amountToGive: 'दिनुपर्ने रकम',
    transactionDate: 'लेनदेन मिति',
    descriptionItemsNotes: 'विवरण / वस्तुहरू / टिप्पणीहरू',
    enterItemDetails: 'वस्तुको विवरण, टिप्पणी, वा विवरण प्रविष्ट गर्नुहोस्',
    thisFieldCannotBeChanged: 'यो फिल्ड परिवर्तन गर्न सकिँदैन',
    entry: 'प्रविष्टि',
    addAnotherEntry: 'अर्को प्रविष्टि थप्नुहोस्',
    savingEntries: 'प्रविष्टिहरू बचत गर्दै...',
    updatingEntry: 'प्रविष्टि अपडेट गर्दै...',
    updateEntry: 'प्रविष्टि अपडेट गर्नुहोस्',
    saveEntry: 'प्रविष्टि बचत गर्नुहोस्',
    saveEntries: 'प्रविष्टिहरू बचत गर्नुहोस्',
    deleteEntry: 'प्रविष्टि मेटाउनुहोस्',
    deleteEntryConfirm: 'के तपाईं यो लेनदेन प्रविष्टि मेटाउन निश्चित हुनुहुन्छ? यो कार्य पूर्ववत गर्न सकिँदैन।',
    entryUpdatedSuccessfully: 'प्रविष्टि सफलतापूर्वक अपडेट भयो',
    entryDeletedSuccessfully: 'प्रविष्टि सफलतापूर्वक मेटाइयो',
    failedToSaveEntry: 'प्रविष्टि बचत गर्न असफल। कृपया फेरि प्रयास गर्नुहोस्।',
    failedToDeleteEntry: 'प्रविष्टि मेटाउन असफल। कृपया फेरि प्रयास गर्नुहोस्।',
    amountIsRequired: 'रकम आवश्यक छ',
    pleaseEnterValidAmount: 'कृपया मान्य रकम प्रविष्ट गर्नुहोस्',
    youMustBeLoggedIn: 'प्रविष्टिहरू बचत गर्न तपाईं लग इन हुनुपर्छ',
    missingRequiredInformation: 'प्रविष्टि अपडेट गर्न आवश्यक जानकारी छुटेको छ',
    success: 'सफलता',
    error: 'त्रुटि',
    ok: 'ठीक छ',
    
    // Customer Form
    editCustomer: 'ग्राहक सम्पादन गर्नुहोस्',
    addCustomerForm: 'ग्राहक थप्नुहोस्',
    updateCustomerDetails: 'तलका ग्राहक विवरणहरू अपडेट गर्नुहोस्',
    enterCustomerDetails: 'तलका ग्राहक विवरणहरू प्रविष्ट गर्नुहोस्',
    customerNameForm: 'ग्राहकको नाम',
    enterCustomerName: 'ग्राहकको नाम प्रविष्ट गर्नुहोस्',
    phoneNumberOptional: 'फोन नम्बर (वैकल्पिक)',
    mobileNumber: 'मोबाइल नम्बर',
    updateCustomer: 'ग्राहक अपडेट गर्नुहोस्',
    saveCustomer: 'ग्राहक बचत गर्नुहोस्',
    saving: 'बचत गर्दै...',
    chooseFromContactsOrAddManually: 'सम्पर्कहरूबाट छान्नुहोस् वा म्यानुअल रूपमा थप्नुहोस्',
    searchContacts: 'सम्पर्कहरू खोज्नुहोस्',
    customerNameSearch: 'ग्राहकको नाम',
    loadingContacts: 'सम्पर्कहरू लोड गर्दै...',
    contactsAvailable: 'सम्पर्कहरू उपलब्ध छन्',
    yourContacts: 'तपाईंका सम्पर्कहरू',
    accessYourContacts: 'तपाईंका सम्पर्कहरू पहुँच गर्नुहोस्',
    grantPermissionToQuicklyAdd: 'तपाईंको फोन सम्पर्कहरूबाट छिट्टै ग्राहकहरू थप्न अनुमति दिनुहोस्।',
    grantPermission: 'अनुमति दिनुहोस्',
    onDesktopYouCanManually: '💡 डेस्कटपमा, तपाईं माथि म्यानुअल रूपमा ग्राहकको नाम प्रविष्ट गर्न सक्नुहुन्छ। सम्पर्क पहुँच मोबाइल उपकरणहरूमा उपलब्ध छ।',
    noContactsFoundMatching: 'कुनै सम्पर्क फेला परेन',
    noContactsAvailable: 'कुनै सम्पर्क उपलब्ध छैन',
    
    // About
    aboutContent: `मेरो हिसाब नेपाली विक्रम संवत् क्यालेन्डर प्रणाली प्रयोग गरेर चक्रवृद्धि ब्याज गणना गर्नको लागि एक विशेषीकृत उपकरण हो।

विशेषताहरू:
• सटीक बि.स. मिति गणनाहरू
• वार्षिक चक्रवृद्धि ब्याज
• महिना र दिनहरूको लागि साधारण ब्याज
• बि.स. वर्ष २०७०-२०८४ को समर्थन
• द्विभाषी समर्थन (अंग्रेजी/नेपाली)
• अँध्यारो/उज्यालो मोड समर्थन
• अफलाइन गणनाहरू
• कुनै डेटा सङ्कलन छैन

एपले एक विशिष्ट गणना पद्धति पछ्याउँछ:
- मूल रकममा वार्षिक चक्रवृद्धि ब्याज लागू
- बाँकी महिनाहरूको लागि साधारण ब्याज
- बाँकी दिनहरूको लागि साधारण दैनिक ब्याज

यो एप नेपाली क्यालेन्डर प्रणाली प्रयोग गरेर वित्तीय योजना, ऋण गणना, र लगानी प्रक्षेपणको लागि उत्तम छ।`
  }
};

export const [LanguageProvider, useLanguage] = createContextHook((): LanguageContextType => {
  const [language, setLanguageState] = useState<Language>('ne'); // Default to Nepali
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ne')) {
        setLanguageState(savedLanguage as Language);
      } else {
        // Set default to Nepali if no saved language
        setLanguageState('ne');
        await AsyncStorage.setItem('app_language', 'ne');
      }
    } catch (error) {
      console.log('Error loading language:', error);
      // Fallback to Nepali on error
      setLanguageState('ne');
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return {
    language,
    setLanguage,
    t,
    isLoading
  };
});