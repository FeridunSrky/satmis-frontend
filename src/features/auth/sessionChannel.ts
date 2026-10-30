const CHANNEL_NAME = 'satmis-session';
const LOGGED_OUT_MESSAGE = 'logged-out';

// One channel per tab: BroadcastChannel never delivers a message back to the instance that sent it
let activeChannel: BroadcastChannel | null = null;

/**
 * Lets other tabs drop their in-memory session as soon as this one logs out. Without it they would
 * only notice on their next request. Returns a function that closes the channel.
 */
export function openSessionChannel(onLoggedOutElsewhere: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => undefined;
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent) => {
    if (event.data === LOGGED_OUT_MESSAGE) {
      onLoggedOutElsewhere();
    }
  };
  activeChannel = channel;
  return () => {
    channel.close();
    if (activeChannel === channel) {
      activeChannel = null;
    }
  };
}

export function announceLoggedOut(): void {
  activeChannel?.postMessage(LOGGED_OUT_MESSAGE);
}
