import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** localStorage key holding this browser's generated visitor id. */
const VISITOR_ID_KEY = 'rm_visitor_id';
/** Prefix of the per-post keys remembering "this visitor liked it". */
const LIKE_KEY_PREFIX = 'blog_liked_';
/** Used during SSR and whenever localStorage is unavailable. */
const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Single source of truth for blog like state on the public site.
 *
 * The blog APIs never report a like back to us — `GetBlogBySlug` omits
 * `isLiked` entirely and the list endpoint always returns `false` because it
 * takes no user — so the visitor's own like has to be remembered in this
 * browser and re-applied whenever a post is rendered again.
 */
@Injectable({ providedIn: 'root' })
export class BlogLikeService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    /**
     * Stable id for this visitor, persisted so the API can tell one anonymous
     * reader from another. Every visitor used to post the all-zero GUID, which
     * left the server holding one shared like row per post: the next reader to
     * click "like" deleted the previous reader's like, got an "Unliked."
     * response, and watched their freshly filled heart flip straight back to
     * unliked.
     */
    readonly userId: string = this.resolveUserId();

    /** True when this visitor has already liked the post. */
    isLiked(blogId: string | number | undefined | null): boolean {
        if (!this.isBrowser || blogId === undefined || blogId === null) return false;
        try {
            return localStorage.getItem(`${LIKE_KEY_PREFIX}${blogId}`) === 'true';
        } catch {
            return false;
        }
    }

    /**
     * Records the visitor's like state for a post. Call this with the server's
     * answer as well as with the optimistic one, so the remembered flag can
     * never drift away from what the API actually stored.
     */
    remember(blogId: string | number | undefined | null, isLiked: boolean): void {
        if (!this.isBrowser || blogId === undefined || blogId === null) return;
        const key = `${LIKE_KEY_PREFIX}${blogId}`;
        try {
            if (isLiked) localStorage.setItem(key, 'true');
            else localStorage.removeItem(key);
        } catch {
            // Private-mode / storage-full: the like still reached the server.
        }
    }

    /** Applies the remembered like state to blogs coming back from the API. */
    applyRemembered<T extends { id?: string | number; isLiked?: boolean }>(blogs: T[]): T[] {
        return blogs.map(blog =>
            this.isLiked(blog.id) ? { ...blog, isLiked: true } : blog
        );
    }

    private resolveUserId(): string {
        if (!this.isBrowser) return ANONYMOUS_USER_ID;
        try {
            const existing = localStorage.getItem(VISITOR_ID_KEY);
            if (existing) return existing;
            const generated = this.createId();
            localStorage.setItem(VISITOR_ID_KEY, generated);
            return generated;
        } catch {
            return ANONYMOUS_USER_ID;
        }
    }

    /** GUID for this browser; `randomUUID` needs a secure context, so guard it. */
    private createId(): string {
        const webCrypto = globalThis.crypto;
        if (typeof webCrypto?.randomUUID === 'function') return webCrypto.randomUUID();

        const bytes = new Uint8Array(16);
        if (typeof webCrypto?.getRandomValues === 'function') {
            webCrypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
}
