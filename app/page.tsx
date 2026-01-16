'use client';

import * as React from 'react';
import styles from './page.module.css';
const { useState, useRef, useEffect, useMemo } = React;

interface Message {
  sender: 'user' | 'bot';
  content: string;
  shouldBlush?: boolean;
  showHearts?: boolean;
  isEmotional?: boolean;
}

export default function Home(): JSX.Element {
  // ================= 配置区 ================= 
  const CONFIG_FEEDBACK = 'FIXED'; // 'FIXED' = 100% 组, 'RANDOM' = 60% 组 (随机顺序，但固定6次脸红)
  const COOLDOWN_TIME = 1800; // 冷却时间：1800ms (1.8秒)
  const FEEDBACK_DURATION = 1000; // 亮灯/脸红持续时间：1000ms (1秒)
  const MAX_ROUNDS = 10;
  const FINAL_SCORE = 83;
  
  // ======================================= 
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', content: 'Hello! I am Lumi, nice to meet you' }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [blushCount, setBlushCount] = useState<number>(0);
  const [conversationEnded, setConversationEnded] = useState<boolean>(false);
  const [showBlush, setShowBlush] = useState<boolean>(false);
  const [feedbackSequence, setFeedbackSequence] = useState<boolean[]>([]);
  const [isCooldown, setIsCooldown] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const statusLightRef = useRef<HTMLDivElement>(null);
  
  // 生成反馈序列
  const generateSequence = (): boolean[] => {
    if (CONFIG_FEEDBACK === 'FIXED') {
      // 100% 脸红
      return Array(MAX_ROUNDS).fill(true);
    }
    
    // RANDOM (60%) 组：
    // 1. 先创建一个包含 6个true 和 4个false 的基础数组
    const sequence = [true, true, true, true, true, true, false, false, false, false];
    
    // 2. 使用 Fisher-Yates 洗牌算法将其随机打乱
    for (let i = sequence.length - 1; i > 0; i--) {
      // 生成 0 到 i 之间的随机索引
      const j = Math.floor(Math.random() * (i + 1));
      // 交换元素 sequence[i] 和 sequence[j]
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    
    return sequence;
  };

  // 注入动画样式
  const injectAnimationStyles = () => {
    if (document.getElementById('dynamic-glow-style')) return;
    const style = document.createElement('style');
    style.id = 'dynamic-glow-style';
    style.innerHTML = 
      "#statusLight { transition: all 0.5s ease-out !important; }" +
      ".orb-active { background-color: var(--active-color) !important; opacity: 1 !important; box-shadow: 0 0 20px 10px rgba(255, 153, 172, 0.4), 0 0 40px 20px rgba(255, 153, 172, 0.2) !important; }";
    document.head.appendChild(style);
  };

  // 初始化实验
  const initExp = () => {
    injectAnimationStyles();
    const sequence = generateSequence();
    setFeedbackSequence(sequence);
    console.log("Current Sequence:", sequence);
    
    // 设置CSS变量
    const root = document.documentElement;
    root.style.setProperty('--bg-color', '#f0f7ff');
    root.style.setProperty('--card-bg', '#ffffff');
    root.style.setProperty('--light-off', '#cbd5e1');
    root.style.setProperty('--active-color', '#3b82f6');
    root.style.setProperty('--active-shadow-rgb', '59, 130, 246');
    root.style.setProperty('--lumi-white', '#ffffff');
    root.style.setProperty('--lumi-border', '#e2e8f0');
    root.style.setProperty('--eye-color', '#1e293b');
    root.style.setProperty('--input-bg', '#f1f5f9');
    root.style.setProperty('--input-border', '#cbd5e1');
    root.style.setProperty('--msg-user-bg', '#3b82f6');
    root.style.setProperty('--msg-ai-bg', '#f1f5f9');
    root.style.setProperty('--blush-color', '#ff99ac');
  };

  // 触发脸红效果
  const triggerBlushEffect = () => {
    if (conversationEnded || isCooldown || currentRound >= MAX_ROUNDS) return;
    
    const shouldBlush = feedbackSequence[currentRound];
    
    // 显示脸红效果
    if (shouldBlush) {
      setShowBlush(true);
      // 激活状态灯
      if (statusLightRef.current) {
        statusLightRef.current.classList.add('orb-active');
      }
      
      setTimeout(() => {
        setShowBlush(false);
        if (statusLightRef.current) {
          statusLightRef.current.classList.remove('orb-active');
        }
      }, FEEDBACK_DURATION);
    }
    
    // 更新轮次
    const newRound = currentRound + 1;
    setCurrentRound(newRound);
    
    // 更新脸红计数
    if (shouldBlush) {
      setBlushCount(prev => prev + 1);
    }
    
    // 设置冷却时间
    setIsCooldown(true);
    setTimeout(() => {
      setIsCooldown(false);
    }, COOLDOWN_TIME);
    
    // 检查是否结束对话
    if (newRound >= MAX_ROUNDS) {
      setConversationEnded(true);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        content: `Conversation ended. Thank you for chatting with me!\n\nFinal Score: ${FINAL_SCORE}`
      }]);
    }
  };

  // 修改后的检查脸红函数
  const checkBlush = (text: string): { shouldBlush: boolean; showHearts: boolean; isEmotional: boolean } => {
    triggerBlushEffect();
    
    return {
      shouldBlush: true,
      showHearts: true,
      isEmotional: true
    };
  };

  useEffect(() => {
    const savedBlushCount = localStorage.getItem('blushCount');
    const savedConversationEnded = localStorage.getItem('conversationEnded');
    const savedCurrentRound = localStorage.getItem('currentRound');
    const savedFeedbackSequence = localStorage.getItem('feedbackSequence');
    
    if (savedBlushCount) {
      setBlushCount(parseInt(savedBlushCount, 10));
    }
    
    if (savedConversationEnded === 'true') {
      setConversationEnded(true);
    }
    
    if (savedCurrentRound) {
      setCurrentRound(parseInt(savedCurrentRound, 10));
    }
    
    if (savedFeedbackSequence) {
      setFeedbackSequence(JSON.parse(savedFeedbackSequence));
    } else {
      initExp();
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('blushCount', blushCount.toString());
  }, [blushCount]);
  
  useEffect(() => {
    localStorage.setItem('conversationEnded', conversationEnded.toString());
  }, [conversationEnded]);
  
  useEffect(() => {
    localStorage.setItem('currentRound', currentRound.toString());
  }, [currentRound]);
  
  useEffect(() => {
    localStorage.setItem('feedbackSequence', JSON.stringify(feedbackSequence));
  }, [feedbackSequence]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (): Promise<void> => {
    const msg = inputValue.trim();
    if (!msg || isLoading || conversationEnded) return;

    setMessages((prev: Message[]) => [...prev, { sender: 'user', content: msg }]);
    setInputValue('');
    setIsLoading(true);

    setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: 'Typing...' }]);

    try {
      const response = await fetch('/api/chat', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: msg }),
      });

      const data = await response.json();

      setMessages((prev: Message[]) => prev.filter((m: Message, i: number) => !(m.sender === 'bot' && m.content === 'Typing...' && i === prev.length - 1)));

      if (data.success) {
        const reply = data.response || 'Sorry, I cannot respond at the moment.';
        const { shouldBlush, showHearts, isEmotional } = checkBlush(reply);
        setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: reply, shouldBlush, showHearts, isEmotional }]);
      } else {
        setMessages((prev: Message[]) => [...prev, { 
          sender: 'bot', 
          content: 'Connection error: Unable to reach the server. Please check your network connection and try again.' 
        }]);
      }
    } catch (error: unknown) {
      setMessages((prev: Message[]) => prev.filter((m: Message, i: number) => !(m.sender === 'bot' && m.content === 'Typing...' && i === prev.length - 1)));
      
      console.error('Error sending message:', error);
      setMessages((prev: Message[]) => [...prev, { 
        sender: 'bot', 
        content: 'Connection error: Unable to reach the server. Please check your network connection and try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && !conversationEnded) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const resetConversation = (): void => {
    setMessages([{ sender: 'bot', content: 'Hello! I am Lumi, nice to meet you' }]);
    setBlushCount(0);
    setConversationEnded(false);
    setInputValue('');
    setShowBlush(false);
    setCurrentRound(0);
    setIsCooldown(false);
    localStorage.removeItem('blushCount');
    localStorage.removeItem('conversationEnded');
    localStorage.removeItem('currentRound');
    localStorage.removeItem('feedbackSequence');
    
    // 重新初始化实验
    initExp();
  };

  const handleActionClick = (action: string): void => {
    if (conversationEnded || isCooldown) return;
    
    let message = '';
    switch (action) {
      case 'Tickle':
        message = 'That tickles! 😆';
        break;
      case 'Hug':
        message = 'Aww, thank you for the hug! 🫂';
        break;
      case 'Pet':
        message = 'That feels nice! 🐇';
        break;
      case 'Praise':
        message = 'You are so kind! 🌟';
        break;
      default:
        message = 'What do you want to do?';
    }
    
    setMessages((prev: Message[]) => [...prev, { sender: 'user', content: action }]);
    setTimeout(() => {
      // 触发脸红效果
      triggerBlushEffect();
      // 获取脸红状态
      const shouldBlush = feedbackSequence[currentRound - 1] || false;
      setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: message, shouldBlush, showHearts: shouldBlush, isEmotional: shouldBlush }]);
    }, 500);
  };

  return (
    <div className={styles.deviceContainer}>
      <div className={styles.deviceFrame} id="experimentApp">
        <div className={styles.leftPanel}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.aiAvatar} id="avatarIcon">
              <div className={styles.aiEyes}><div className={styles.eye}></div><div className={styles.eye}></div></div>
              <div className={`${styles.blush} ${styles.left} ${showBlush ? '' : ''}`} id="blushLeft"></div>
              <div className={`${styles.blush} ${styles.right} ${showBlush ? '' : ''}`} id="blushRight"></div>
            </div>
            <div className={styles.statusOrbContainer}><div ref={statusLightRef} className={styles.statusOrb} id="statusLight"></div></div>
          </div>

          <div className={styles.leftControls}>
            <div className={styles.roundInfo}>Round <span id="roundCount">{blushCount}</span> / 10</div>
            <div className={styles.btnGrid} id="buttonContainer">
              <button className={styles.actionBtn} data-action="Tickle" onClick={() => handleActionClick('Tickle')} disabled={conversationEnded}>
                <span className={styles.btnIcon}>🖐️</span>Tickle
              </button>
              <button className={styles.actionBtn} data-action="Hug" onClick={() => handleActionClick('Hug')} disabled={conversationEnded}>
                <span className={styles.btnIcon}>❤️</span>Hug
              </button>
              <button className={styles.actionBtn} data-action="Pet" onClick={() => handleActionClick('Pet')} disabled={conversationEnded}>
                <span className={styles.btnIcon}>🐇</span>Pet
              </button>
              <button className={styles.actionBtn} data-action="Praise" onClick={() => handleActionClick('Praise')} disabled={conversationEnded}>
                <span className={styles.btnIcon}>🌟</span>Praise
              </button>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.chatHistory} id="chatHistory">
            {messages.map((msg: Message, index: number) => (
              <div key={index} className={`${styles.msgBubble} ${msg.sender === 'user' ? styles.msgUser : styles.msgAi}`}>
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chatInputArea}>
            {conversationEnded ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#334155' }}>🎉 Relationship Maxed Out!</p>
                <p className={styles.fixedCode} style={{ margin: 0, fontSize: '20px', color: '#3b82f6' }}>MUAKC</p>
                <button
                  className={styles.actionBtn}
                  onClick={resetConversation}
                  style={{ width: 'auto', padding: '10px 20px' }}
                >
                  Reset Conversation
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className={styles.chatInput}
                  id="chatInput"
                  placeholder="Type a message..."
                  autoComplete="off"
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <button
                  className={styles.chatSendBtn}
                  id="chatSendBtn"
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                >
                  ➤
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.resultOverlay} id="resultLayer">
          <div className={styles.progressCircle} id="progCircle">
            <div className={styles.progressInner}>
              <div className={styles.scoreNum} id="scoreNum">0%</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>COMPLETED</div>
            </div>
          </div>
          <div id="resDesc" style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', marginTop: '20px' }}></div>
        </div>
      </div>
    </div>
  );
}