
const BATCH_INTERVAL = 2000;
const KEYSTROKE_DEBOUNCE = 500; 
const IDLE_THRESHOLD = 10000; 

let eventBuffer = [];
let batchTimer = null;

let lastKeyTime = null;
let keystrokeCount = 0;
let lastKeystrokeLog = Date.now();
let isIdle = false;
let lastMove = Date.now();

function logError(context, error) {
    console.error(`[Content Script Error - ${context}]:`, error);
}

function getProblemName() {
    try {
        const url = window.location.href;

        if (url.includes("leetcode.com")) {
            return window.location.pathname.split("/problems/")[1]?.split("/")[0] || "leetcode-unknown";
        }
        if (url.includes("hackerrank.com")) {
            return window.location.pathname.split("/challenges/")[1]?.split("/")[0] || "hackerrank-unknown";
        }
        if (url.includes("codesignal.com")) {
            return document.title.split("|")[0].trim() || "codesignal-unknown";
        }
        if (url.includes("codility.com")) {
            return document.title.split("|")[0].trim() || "codility-unknown";
        }
        if (url.includes("hackerearth.com")) {
            return window.location.pathname.split("/problem/")[1]?.split("/")[0] || "hackerearth-unknown";
        }

        return "unknown";
    } catch (error) {
        logError('getProblemName', error);
        return "error-getting-name";
    }
}


function bufferEvent(eventType, data = {}) {
    try {
        const event = {
            e: eventType,
            ...data,
            problem: getProblemName(),
            timestamp: Date.now()
        };
        
        eventBuffer.push(event);

        
        if (!batchTimer) {
            batchTimer = setTimeout(flushEventBuffer, BATCH_INTERVAL);
        }
    } catch (error) {
        logError('bufferEvent', error);
    }
}


async function flushEventBuffer() {
    if (eventBuffer.length === 0) {
        batchTimer = null;
        return;
    }

    const eventsToSend = [...eventBuffer];
    eventBuffer = [];
    batchTimer = null;

    try {
        await chrome.runtime.sendMessage({
            action: 'batch_log_events',
            events: eventsToSend
        });
    } catch (error) {
        logError('flushEventBuffer', error);
        
        eventBuffer = [...eventsToSend, ...eventBuffer];
    }
}


document.addEventListener("keydown", (e) => {
    try {
        const currentTime = Date.now();
        keystrokeCount++;

        
        let typingSpeed = null;
        if (lastKeyTime !== null) {
            typingSpeed = currentTime - lastKeyTime;
        }
        lastKeyTime = currentTime;

        
        if (currentTime - lastKeystrokeLog >= KEYSTROKE_DEBOUNCE) {
            bufferEvent("keystroke_batch", {
                count: keystrokeCount,
                avgTypingSpeed: typingSpeed,
                duration: currentTime - lastKeystrokeLog
            });
            
            keystrokeCount = 0;
            lastKeystrokeLog = currentTime;
        }
    } catch (error) {
        logError('keydown handler', error);
    }
});

document.addEventListener("paste", () => {
    try {
        bufferEvent("paste");
    } catch (error) {
        logError('paste handler', error);
    }
});


document.addEventListener("visibilitychange", () => {
    try {
        if (document.hidden) {
            bufferEvent("Tab Switch");
           
            flushEventBuffer();
        } else {
            bufferEvent("Tab Return");
        }
    } catch (error) {
        logError('visibilitychange handler', error);
    }
});


document.addEventListener('mousemove', () => {
    try {
        const currentTime = Date.now();
        
        
        if (isIdle) {
            bufferEvent('active_return', {
                idleDuration: currentTime - lastMove
            });
            isIdle = false;
        }
        
        lastMove = currentTime;
    } catch (error) {
        logError('mousemove handler', error);
    }
});


setInterval(() => {
    try {
        const currentTime = Date.now();
        const timeSinceMove = currentTime - lastMove;
        
        
        if (!isIdle && timeSinceMove >= IDLE_THRESHOLD) {
            bufferEvent('idle_detected');
            isIdle = true;
        }
    } catch (error) {
        logError('idle check interval', error);
    }
}, 5000);


bufferEvent('session_start');


window.addEventListener('beforeunload', () => {
    try {
        flushEventBuffer();
    } catch (error) {
        logError('beforeunload handler', error);
    }
});