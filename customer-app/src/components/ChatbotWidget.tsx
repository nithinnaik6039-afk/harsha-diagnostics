import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Linking,
  Dimensions
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../constants/translations';

// Hardcoded FAQ data matching the DB seed for instantaneous offline capabilities
const faqs = [
  {
    id: 1,
    q_en: 'What are your working hours?',
    q_te: 'మీ పని వేళలు ఏమిటి?',
    a_en: 'We are open 7:00 AM to 9:00 PM, all 7 days. Early-morning slots (6–8 AM) are available for fasting tests.',
    a_te: 'మేము వారంలో 7 రోజులు ఉదయం 7:00 నుండి రాత్రి 9:00 వరకు అందుబాటులో ఉంటాము. ఖాళీ కడుపుతో చేసే పరీక్షల కోసం తెల్లవారుజామున (ఉదయం 6-8 గంటలకు) స్లాట్లు అందుబాటులో ఉన్నాయి.',
    keywords: ['hours', 'timings', 'time', 'open', 'working', 'సమయం', 'పనివేళలు']
  },
  {
    id: 2,
    q_en: 'Where is Harsha Diagnostics located?',
    q_te: 'హర్ష డయాగ్నోస్టిక్స్ ఎక్కడ ఉంది?',
    a_en: '#26/3, Venkateswara Swamy Arch, Opposite Housing Board, 80 Feet Road, MIG Bus Stand, Anantapuramu – 515001.',
    a_te: '#26/3, వెంకటేశ్వర స్వామి ఆర్చ్, హౌసింగ్ బోర్డు ఎదురుగా, 80 ఫీట్ల రోడ్డు, MIG బస్ స్టాండ్, అనంతపురము - 515001.',
    keywords: ['location', 'address', 'branch', 'where', 'అడ్రస్', 'ఎక్కడ', 'హౌసింగ్ బోర్డ్']
  },
  {
    id: 3,
    q_en: 'Is home collection really free?',
    q_te: 'ఇంటి వద్ద శాంపిల్ కలెక్షన్ నిజంగా ఉచితమేనా?',
    a_en: 'Yes! Home collection is 100% free within 3 km. From 3–5 km a small ₹20 visit charge applies, shown clearly at checkout.',
    a_te: 'అవును! 3 కిలోమీటర్ల లోపు హోమ్ కలెక్షన్ 100% ఉచితం. 3-5 కిలోమీటర్ల దూరానికి ₹20 ల విజిటింగ్ ఛార్జీ వర్తిస్తుంది.',
    keywords: ['free', 'home', 'collection', 'charge', 'cost', 'విజిట్', 'ఛార్జీ', 'ఉచితం']
  },
  {
    id: 4,
    q_en: 'How do I book a test?',
    q_te: 'నేను టెస్ట్ ఎలా బుక్ చేయాలి?',
    a_en: 'Open the app → search your test → add to cart → choose address & time slot → pay online or pay the technician at home. Done in under 2 minutes!',
    a_te: 'యాప్ ఓపెన్ చేయండి → టెస్ట్ సెర్చ్ చేయండి → కార్ట్‌కి యాడ్ చేయండి → అడ్రస్ మరియు టైమ్ స్లాట్ ఎంచుకోండి → ఆన్‌లైన్‌లో లేదా ఇంటి వద్ద టెక్నీషియన్‌కు పే చేయండి. 2 నిమిషాల లోపు పూర్తవుతుంది!',
    keywords: ['book', 'order', 'appointment', 'how', 'బుకింగ్', 'ఎలా']
  },
  {
    id: 5,
    q_en: 'When will I get my report?',
    q_te: 'నా రిపోర్ట్ ఎప్పుడు వస్తుంది?',
    a_en: "Most reports are ready within 6–24 hours. You get a PDF in the app, plus a WhatsApp/email copy the moment it's ready.",
    a_te: 'చాలా వరకు రిపోర్ట్‌లు 6-24 గంటలలోపు సిద్ధమవుతాయి. సిద్ధమైన వెంటనే యాప్‌లో PDF ద్వారా, అలాగే వాట్సాప్/ఈమెయిల్ ద్వారా అందుతాయి.',
    keywords: ['report', 'result', 'pdf', 'when', 'రిపోర్ట్', 'ఎప్పుడు', 'ఫలితాలు']
  },
  {
    id: 6,
    q_en: 'Is the technician certified?',
    q_te: 'టెక్నీషియన్ సర్టిఫైడ్ లేబొరేటరీ టెక్నీషియనేనా?',
    a_en: 'Yes. Every MLT is a certified lab technician. You can see their photo, certificate badge and rating in the app before they arrive — and verify them with a 4-digit safety PIN.',
    a_te: 'అవును. ప్రతి MLT సర్టిఫైడ్ ల్యాబ్ టెక్నీషియన్. వారు వచ్చే ముందే యాప్‌లో వారి ఫోటో, సర్టిఫికేట్ బ్యాడ్జ్ మరియు రేటింగ్ చూడవచ్చు.',
    keywords: ['technician', 'phlebotomist', 'mlt', 'certified', 'safe', 'టెక్నీషియన్', 'నమ్మకమైన']
  },
  {
    id: 7,
    q_en: 'Do I need fasting for my test?',
    q_te: 'టెస్ట్ కోసం ఖాళీ కడుపుతో ఉండాలా?',
    a_en: 'It depends on the test. Each test in the app clearly shows if fasting is needed and for how many hours. Fasting tests get priority early-morning slots.',
    a_te: 'ఇది మీరు చేసుకునే టెస్ట్ పైన ఆధారపడి ఉంటుంది. ప్రతి టెస్ట్ పక్కన ఖాళీ కడుపుతో ఉండాలా లేదా అనేది స్పష్టంగా ఉంటుంది.',
    keywords: ['fasting', 'empty', 'stomach', 'eat', 'food', 'ఫాస్టింగ్', 'కడుపు']
  },
  {
    id: 8,
    q_en: 'How do I pay?',
    q_te: 'నేను పేమెంట్ ఎలా చేయాలి?',
    a_en: 'UPI, debit/credit card, net banking — or simply pay cash/UPI to the technician after sample collection.',
    a_te: 'UPI, డెబిట్/క్రెడిట్ కార్డ్, నెట్ బ్యాంకింగ్ ద్వారా లేదా శాంపిల్ సేకరించిన తర్వాత టెక్నీషియన్‌కు నగదు/UPI ద్వారా చెల్లించవచ్చు.',
    keywords: ['pay', 'payment', 'cash', 'upi', 'card', 'డబ్బులు', 'పేమెంట్']
  },
  {
    id: 9,
    q_en: 'Can I book for my parents or family?',
    q_te: 'నేను నా తల్లిదండ్రులు లేదా కుటుంబ సభ్యుల కోసం బుక్ చేయవచ్చా?',
    a_en: 'Yes! Add family member profiles in the app and book for anyone. You can also track the technician live for their visit.',
    a_te: 'అవును! యాప్‌లో కుటుంబ సభ్యుల ప్రొఫైల్‌లను యాడ్ చేసి ఎవరికైనా బుక్ చేయవచ్చు.',
    keywords: ['family', 'parents', 'children', 'others', 'కుటుంబం', 'పేరెంట్స్']
  },
  {
    id: 10,
    q_en: 'What if I need to cancel?',
    q_te: 'ఒకవేళ బుకింగ్ రద్దు చేయాలంటే ఎలా?',
    a_en: 'Cancellation is free any time before a technician is assigned. After assignment, a small charge may apply. Refunds are processed in 3–5 working days.',
    a_te: 'టెక్నీషియన్ కేటాయించబడక ముందే క్యాన్సిలేషన్ ఉచితం. కేటాయించిన తర్వాత చిన్న రుసుము వర్తించవచ్చు.',
    keywords: ['cancel', 'cancellation', 'refund', 'మార్చుకోండి', 'క్యాన్సిల్']
  },
  {
    id: 11,
    q_en: 'Which areas do you serve?',
    q_te: 'మీరు ఏ ఏ ప్రాంతాలలో సేవలందిస్తున్నారు?',
    a_en: "Currently we serve within 5 km of our center in Anantapuramu. Enter your address in the app to instantly check. We're expanding soon — join the waitlist if you're outside!",
    a_te: 'ప్రస్తుతం మేము అనంతపురములోని మా సెంటర్ నుండి 5 కిలోమీటర్ల లోపు సేవలందిస్తున్నాము. యాప్‌లో మీ చిరునామాను ఎంటర్ చేసి చెక్ చేసుకోండి.',
    keywords: ['area', 'serve', 'service', 'locations', 'అనంతపురం', 'ప్రాంతాలు']
  },
  {
    id: 12,
    q_en: 'How can I contact you?',
    q_te: 'మిమ్మల్ని ఎలా సంప్రదించాలి?',
    a_en: "Call or WhatsApp us at 1800-200-8899, or use the in-app chat. We're happy to help!",
    a_te: 'మాకు 1800-200-8899 నంబర్‌కు కాల్ లేదా వాట్సాప్ చేయండి, లేదా యాప్ ద్వారా సంప్రదించండి.',
    keywords: ['contact', 'phone', 'whatsapp', 'call', 'support', 'ఫోన్', 'సహాయం', 'వాట్సాప్']
  }
];

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export const ChatbotWidget: React.FC = () => {
  const language = useAppStore((state) => state.language);
  const [visible, setVisible] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize chatbot dialog
  const initializeChat = () => {
    const greeting =
      language === 'te'
        ? 'నమస్తే! హర్ష డయాగ్నోస్టిక్స్ సపోర్ట్ చాట్‌కు స్వాగతం. ఈ క్రింది ప్రశ్నల నుండి ఎంచుకోండి లేదా మీ సందేహాన్ని టైప్ చేయండి:'
        : 'Hello! Welcome to Harsha Diagnostics support chat. Please pick a question below or type your query:';
    setMessages([{ id: '1', sender: 'bot', text: greeting }]);
  };

  useEffect(() => {
    if (visible && messages.length === 0) {
      initializeChat();
    }
  }, [visible]);

  // Handle Q&A chip tap
  const handleChipTap = (faq: typeof faqs[0]) => {
    const userQ = language === 'te' ? faq.q_te : faq.q_en;
    const botA = language === 'te' ? faq.a_te : faq.a_en;

    const userMsg: Message = { id: Math.random().toString(), sender: 'user', text: userQ };
    const botMsg: Message = { id: Math.random().toString(), sender: 'bot', text: botA };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Process text input matching keywords
  const handleSendText = () => {
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    const userMsg: Message = { id: Math.random().toString(), sender: 'user', text: userText };

    // Search keywords
    const lowerVal = userText.toLowerCase();
    const matchedFaq = faqs.find((faq) =>
      faq.keywords.some((kw) => lowerVal.includes(kw))
    );

    let botText = '';
    if (matchedFaq) {
      botText = language === 'te' ? matchedFaq.a_te : matchedFaq.a_en;
    } else {
      botText =
        language === 'te'
          ? 'సారీ, దానికి సంబంధించిన సమాచారం నా దగ్గర లేదు. మరిన్ని వివరాల కోసం మాకు 1800-200-8899 నంబర్‌కు కాల్ చేయండి.'
          : "Sorry, I couldn't find an answer for that. Please call us at 1800-200-8899 or WhatsApp us for direct help.";
    }

    const botMsg: Message = { id: Math.random().toString(), sender: 'bot', text: botText };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputVal('');
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:18002008899');
  };

  return (
    <>
      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.chatIcon}>💬</Text>
      </TouchableOpacity>

      {/* Chat Window Modal */}
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>
                  {language === 'te' ? 'హర్ష సపోర్ట్ చాట్' : 'Harsha Support Chat'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {language === 'te' ? 'ఆఫ్‌లైన్ అసిస్టెంట్' : 'Offline Assistant'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Conversation Log */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesList}
              contentContainerStyle={styles.scrollContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.sender === 'user' ? styles.userBubble : styles.botBubble
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userText : styles.botText
                  ]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Suggestion Chips */}
            <View style={styles.chipsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {faqs.map((faq) => (
                  <TouchableOpacity
                    key={faq.id}
                    style={styles.chip}
                    onPress={() => handleChipTap(faq)}
                  >
                    <Text style={styles.chipText}>
                      {language === 'te' ? faq.q_te : faq.q_en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder={language === 'te' ? 'సందేశాన్ని టైప్ చేయండి...' : 'Ask a question...'}
                value={inputVal}
                onChangeText={setInputVal}
                onSubmitEditing={handleSendText}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendText}>
                <Text style={styles.sendIcon}>➔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn} onPress={handlePhoneCall}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#0284c7', // Sky-600
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999
  },
  chatIcon: {
    fontSize: 28,
    color: '#fff'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Slate-900 transparent
    justifyContent: 'flex-end'
  },
  chatContainer: {
    height: Dimensions.get('window').height * 0.75,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#0284c7',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: '#e0f2fe',
    fontSize: 12
  },
  closeButton: {
    padding: 8
  },
  closeIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f8fafc' // Slate-50
  },
  scrollContent: {
    padding: 16
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12
  },
  botBubble: {
    backgroundColor: '#e2e8f0', // Slate-200
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4
  },
  userBubble: {
    backgroundColor: '#0284c7',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  botText: {
    color: '#1e293b'
  },
  userText: {
    color: '#fff'
  },
  chipsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    paddingVertical: 8
  },
  chipsScroll: {
    paddingHorizontal: 12
  },
  chip: {
    backgroundColor: '#f0f9ff', // Sky-50
    borderColor: '#bae6fd', // Sky-200
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8
  },
  chipText: {
    color: '#0369a1', // Sky-700
    fontSize: 12
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
    color: '#0f172a'
  },
  sendBtn: {
    backgroundColor: '#0284c7',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16
  },
  callBtn: {
    backgroundColor: '#10b981', // Emerald-500
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  callIcon: {
    color: '#fff',
    fontSize: 16
  }
});
