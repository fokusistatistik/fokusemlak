// =======================
// FOKUS216 CHATBOT WIDGET
// =======================

function addChatbotWidget() {
  const chatbotHTML = `
    <div id="fokus216-chatbot-widget" style="
      position: fixed;
      bottom: 60px;
      right: 30px;
      font-family: Arial, sans-serif;
      z-index: 9999;
      user-select: none;
    ">
      <style>
        #chatbot-icon {
          border-radius: 12px;
          padding: 8px;
          width: 75px;
          text-align: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          cursor: pointer;
          box-shadow: 0 8px 16px rgba(30, 58, 138, 0.4), 0 4px 8px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          animation: pulse-soft 3s ease-in-out infinite;
        }
        #chatbot-icon:hover {
          transform: scale(1.15);
          box-shadow: 0 12px 24px rgba(30, 58, 138, 0.5), 0 6px 12px rgba(0,0,0,0.3);
        }
        @keyframes pulse-soft {
          0%, 100% {
            box-shadow: 0 8px 16px rgba(30, 58, 138, 0.4), 0 4px 8px rgba(0,0,0,0.2);
          }
          50% {
            box-shadow: 0 8px 20px rgba(30, 58, 138, 0.6), 0 4px 10px rgba(0,0,0,0.25);
          }
        }
        #chatbot-icon img {
          width: 48px;
          height: 48px;
          display: block;
          margin: 0 auto;
          filter: brightness(1.1);
        }
        #chatbot-icon .description {
          font-size: 9px;
          color: white;
          font-weight: 600;
          margin-top: 4px;
          text-transform: capitalize;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        #iframe-container {
          position: relative;
          display: none;
          margin-top: 6px;
          width: 350px;
          height: 500px;
          border-radius: 12px;
          overflow: hidden;
        }
        #chatbot-close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.5);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          color: white;
          font-weight: bold;
          cursor: pointer;
          z-index: 10000;
          transition: background 0.3s ease;
        }
        #chatbot-close-btn:hover {
          background: rgba(0,0,0,0.8);
        }
        #chatbot-iframe {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 12px;
          display: block;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          #fokus216-chatbot-widget {
            bottom: 20px;
            right: 20px;
          }
          #iframe-container {
            position: fixed;
            bottom: 0;
            right: 0;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            border-radius: 0;
          }
          #chatbot-iframe {
            border-radius: 0;
          }
        }
      </style>

      <div id="chatbot-icon" title="Chatbot'u aç">
        <img src="/assets/img/fokus216kare.svg" alt="FOKUS216" />
        <div class="description">Size nasıl yardımcı olabilirim?</div>
      </div>

      <div id="iframe-container">
        <button id="chatbot-close-btn" title="Kapat">×</button>
        <iframe id="chatbot-iframe" src="https://asistan.fokusistatistik.com/chatbot216.html"></iframe>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = chatbotHTML;
  document.body.appendChild(div);

  const icon = document.getElementById('chatbot-icon');
  const iframeContainer = document.getElementById('iframe-container');
  const closeBtn = document.getElementById('chatbot-close-btn');

  icon.addEventListener('click', () => {
    iframeContainer.style.display = 'block';
    icon.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    iframeContainer.style.display = 'none';
    icon.style.display = 'block';
  });

  // Pulse animasyonunu başlat
  setTimeout(() => {
    pulseIcon();
  }, 3000);
  setInterval(pulseIcon, 10000);
}

document.addEventListener('DOMContentLoaded', addChatbotWidget);

function pulseIcon() {
  const icon = document.getElementById('chatbot-icon');
  if (!icon) return;

  icon.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.5)' },
      { transform: 'scale(1)' }
    ],
    {
      duration: 2000,
      easing: 'ease-in-out'
    }
  );
}

// Global function to open chatbot programmatically
window.openChatbot = function(propertyContext) {
  const icon = document.getElementById('chatbot-icon');
  const iframeContainer = document.getElementById('iframe-container');
  const chatbotIframe = document.getElementById('chatbot-iframe');

  if (!iframeContainer || !icon) {
    console.error('Chatbot widget not found');
    return false;
  }

  // If property context is provided, store it
  if (propertyContext) {
    sessionStorage.setItem('chatbot_property_context', JSON.stringify(propertyContext));

    // Try to pass context to iframe via postMessage
    if (chatbotIframe && chatbotIframe.contentWindow) {
      try {
        chatbotIframe.contentWindow.postMessage({
          type: 'property_context',
          data: propertyContext
        }, 'https://asistan.fokusistatistik.com');
      } catch (e) {
        console.warn('Could not send message to chatbot iframe:', e);
      }
    }
  }

  // Open the chatbot
  iframeContainer.style.display = 'block';
  icon.style.display = 'none';

  // Trigger pulse animation
  setTimeout(() => {
    if (iframeContainer.style.display === 'block') {
      pulseIcon();
    }
  }, 500);

  return true;
};
