import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config';

interface FoodItem {
  id: number;
  name: string;
  price: number;
  rating: number;
  veg: string;
  calories: number;
  image_url: string;
}

interface ChatBotProps {
  foodItems: FoodItem[];
}

interface Message {
  text: string;
  isUser: boolean;
  isWelcomeMessage?: boolean;
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const formatResponseText = (text: string) => {
  return (
    <Text style={styles.messageText}>
      {text.split('\n').map((line, lineIndex) => {
        // Check if line contains food name with asterisks
        const parts = line.split('**');
        return (
          <Text key={lineIndex}>
            {parts.map((part, partIndex) => {
              // Every odd index (1, 3, 5, etc.) should be bold
              const isBold = partIndex % 2 === 1;
              return (
                <Text
                  key={partIndex}
                  style={isBold ? styles.boldText : undefined}
                >
                  {part}
                </Text>
              );
            })}
            {lineIndex < text.split('\n').length - 1 ? '\n' : ''}
          </Text>
        );
      })}
    </Text>
  );
};

const ChatBot: React.FC<ChatBotProps> = ({ foodItems }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    text: '',
    isUser: false,
    isWelcomeMessage: true
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const WelcomeMessage = () => (
    <View>
      <Text style={styles.messageText}>Hello! I can definitely help you find the perfect food. To give you the best recommendations, I need a little more information about your preferences. Could you tell me:</Text>
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          1. <Text style={styles.boldText}>What's your budget?</Text> (e.g., under ₹10, under ₹15, etc.)
        </Text>
        <Text style={styles.questionText}>
          2. <Text style={styles.boldText}>Are you looking for vegetarian options, non-vegetarian options, or are you open to both?</Text>
        </Text>
        <Text style={styles.questionText}>
          3. <Text style={styles.boldText}>Are you watching your calorie intake? If so, what's your target calorie range?</Text> (e.g., under 300, between 300-400, etc.)
        </Text>
        <Text style={styles.questionText}>
          4. <Text style={styles.boldText}>Is there any particular type of cuisine you're in the mood for?</Text> (e.g., Italian, Indian, American, etc.)
        </Text>
      </View>
      <Text style={styles.messageText}>Once I have this information, I can provide you with personalized recommendations.</Text>
    </View>
  );

  const generatePrompt = (userMessage: string) => {
    const foodItemsString = foodItems
      .map(item => `${item.name} (Price: ₹${item.price}, Rating: ${item.rating}, ${item.veg}, ${item.calories} kcal)`)
      .join('\n');

    return `You are a helpful food assistant. Here is the list of available food items:
${foodItemsString}

User question: ${userMessage}

Please help the user find the best food items based on their preferences. Consider price, rating, whether it's veg/non-veg, and calories.`;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputText('');
    setIsLoading(true);

    try {
      const prompt = generatePrompt(userMessage);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();
      
      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get response from AI. Please try again.'}`, 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.floatingButtonText}>🗨️</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Food Assistant</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messagesContainer}>
              {messages.map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  {message.isWelcomeMessage ? (
                    <WelcomeMessage />
                  ) : (
                    formatResponseText(message.text)
                  )}
                </View>
              ))}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3498db" />
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about food items..."
                placeholderTextColor="#666"
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={isLoading}
              >
                <Text style={styles.sendButtonText}>Send</Text>
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
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: '#f8f8f8',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1a1a1a',
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#1a1a1a',
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  questionContainer: {
    marginVertical: 12,
  },
  questionText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
    marginVertical: 6,
  },
  boldText: {
    fontWeight: '700',
  },
});

export default ChatBot; 