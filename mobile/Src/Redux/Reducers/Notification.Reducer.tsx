import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification } from '../../Assets/Types';

interface Notice {
  id: string;
  title: string;
  body: string;
  bookingId: string | null;
}

interface NotificationState {
  items: AppNotification[];
  unread: number;
  booted: boolean;
  notice: Notice | null;
}

const initialState: NotificationState = { items: [], unread: 0, booted: false, notice: null };

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    refreshInbox() {},
    notificationsLoaded(state, action: PayloadAction<{ notifications: AppNotification[]; unread: number }>) {
      state.items = action.payload.notifications;
      state.unread = action.payload.unread;
      state.booted = true;
    },
    showNotice(state, action: PayloadAction<Notice>) {
      state.notice = action.payload;
    },
    clearNotice(state) {
      state.notice = null;
    },
    markRead(state, action: PayloadAction<string>) {
      const item = state.items.find((note) => note.id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unread = Math.max(0, state.unread - 1);
      }
    },
    markAllRead(state) {
      state.items.forEach((item) => {
        item.isRead = true;
      });
      state.unread = 0;
    },
    resetNotifications() {
      return initialState;
    },
  },
});

export const { refreshInbox, notificationsLoaded, showNotice, clearNotice, markRead, markAllRead, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
