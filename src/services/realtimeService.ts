import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}) => void;

export class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectDelay = 30000;
  private reconnectDelay = 1000;

  subscribeToDocuments(callback: RealtimeCallback<any>) {
    const channelName = 'documents-changes';

    if (this.channels.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as any,
            old: payload.old as any
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectDelay = 1000;
          console.log('Subscribed to documents changes');
        } else if (status === 'CLOSED') {
          this.isConnected = false;
          this.handleDisconnect(channelName, () => this.subscribeToDocuments(callback));
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          this.handleDisconnect(channelName, () => this.subscribeToDocuments(callback));
        }
      });

    this.channels.set(channelName, channel);
  }

  subscribeToCategories(callback: RealtimeCallback<any>) {
    const channelName = 'categories-changes';

    if (this.channels.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as any,
            old: payload.old as any
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectDelay = 1000;
          console.log('Subscribed to categories changes');
        } else if (status === 'CLOSED') {
          this.isConnected = false;
          this.handleDisconnect(channelName, () => this.subscribeToCategories(callback));
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          this.handleDisconnect(channelName, () => this.subscribeToCategories(callback));
        }
      });

    this.channels.set(channelName, channel);
  }

  private handleDisconnect(channelName: string, reconnectFn: () => void) {
    console.log(`Disconnected from ${channelName}, attempting to reconnect...`);

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.unsubscribe(channelName);
      reconnectFn();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const realtimeManager = new RealtimeSubscriptionManager();
