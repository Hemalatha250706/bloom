# Bloom - Lavender Edition (Full Window & Double Blue Tick)

A modern, responsive, and aesthetic **Chat Application Frontend** built exclusively using **React and Tailwind CSS**.

---

## 🖥️ Full Window Layout (Edge-to-Edge)
- **100% Fullscreen Viewport:** The app now takes the complete browser window (100vw x 100vh) without outer padding, margins, or max-width constraints (just like WhatsApp Web and Discord).
- **Seamless Responsiveness:** Left panel and right chat main view flex dynamically across the entire window.

---

## ⭕ Clean & Non-Duplicate Status Experience
- **Single Status List (Zero Duplicates):**
  - "My Status" card cleanly positioned at the top of the feed to view or post your story.
  - Contacts are displayed **exactly once** in a smooth, scrollable list divided into **Recent Updates** and **Viewed Updates**.
  - No duplicate horizontal stories carousel above the feed.
- **Exactly 2 Camera Buttons:**
  - Camera 1: Located in the Status header for quick photo/story capture.
  - Camera 2: Located in the Bottom Navigation Footer for universal access across the app.
  - The third redundant camera button has been removed.
- **Scrollable & Compact Story Viewer with Views & Likes:**
  - Sleek smartphone form factor (`max-w-sm sm:max-h-[600px]`).
  - **👁️ Views Counter & Seen Sheet (For My Status Only):** In strict accordance with WhatsApp privacy standards, the views count and "Seen by" viewers list are strictly available on **your own status**. You cannot see who viewed other people's status.
  - **❤️ Like Status Option:** On contacts' status, click the heart button to like their status with vibrant heart burst animations and instant notification.
  - Supports mouse wheel/trackpad scrolling (`onWheel`), touch swiping, and keyboard arrow navigation.

---

## 📎 Real Local File, Document & Photo Attachments
- **Device File Picker:** Clicking the paperclip icon opens options for "Photos & Media" and "Document / PDF".
- **Real Local Storage Files:** Directly opens your device's native file explorer to pick real photos (JPEG, PNG, WebP) or documents (PDF, Word, TXT, ZIP).
- **Interactive Previews & Rendering:** Real image thumbnails and document badges preview in the input bar and render seamlessly inside chat bubbles.

---

## 📱 Bottom Navigation Footer Bar (All Buttons in Footer)
- **Zero Side Rail ("side vendam"):** The vertical side rail has been completely removed.
- **Convenient Bottom Footer Bar:** All 5 essential navigation buttons are placed at the bottom footer:
  1. 💬 **Chats Tab:** Access your conversations, search bar, and filter tabs (All, Unread, Favorites) with dynamic unread badges.
  2. ⭕ **Status Tab:** Switch to the dedicated Status panel to view your story updates and contacts' stories.
  3. 📷 **Camera Button:** Instantly trigger live webcam capture or photo uploads.
  4. 👤 **Profile Button:** Access and customize your profile photo (upload/delete), edit name, and set WhatsApp-style "About", featuring your avatar and a green online indicator.
  5. 🚪 **Sign Out Button:** One-click return to the login screen with confirmation.

---

## 💙 WhatsApp-Style Double Blue Tick Read Receipts
- **Real-Time Read Receipts:**
  - When you send a message, it starts as **Delivered** (double gray ticks).
  - When the contact views/reads your message, it instantly switches to the iconic **Double Blue Tick (`CheckCheck` in bright sky blue `#38BDF8`)**!
  - Followed by the realistic typing indicator and automated response.
- **Viewing Received Messages:**
  - Selecting any conversation immediately marks unread messages as read.

---

## 📌 Pin & Unpin Conversations
- **One-Click Unpin:** Click the pin icon on any pinned conversation in the sidebar to instantly unpin it.
- **Hover to Pin:** Hover over any conversation in the list and click the pin icon to pin it to the top.
- **Header Menu Toggle:** In the active chat header, open the 3-dots menu (`MoreVertical`) to toggle **"Pin Chat to Top"** or **"Unpin Chat"** anytime.
- **Dynamic Sorting:** Pinned chats always float to the top of the conversation list.
- **Favorites Filter:** The "Favorites" tab automatically filters and displays your pinned conversations.

---

## 😄 Expanded Message Reactions (React with Any Emoji)
- **Top Quick Reactions:** Hover over any message to react with 12 popular emojis (👍, ❤️, 😂, 😮, 😢, 🙏, 🌸, 💜, ✨, 🔥, 🎉, 💯).
- **"+" More Emojis Button:** Click the `+` button in the reaction bar to open the full Apple HD Emoji Picker with instant search and categories, letting you react with **any emoji**.
- **Click to Toggle/Remove:** Click any existing reaction badge to remove it.

---

## 🌸 Core Highlights
- **Clean Online Status (No Extra Round Dot):** Pure text status without distracting dots beside the word "Online".
- **Hidden Scrollbars Everywhere:** All vertical and horizontal scrollbars are completely hidden across all browsers, while full touch, wheel, and trackpad scrolling remains active.
- **Dedicated "Set About" Feature:** View and set custom About lines or choose from 8 instant presets.
- **Profile Photo Upload & Delete:** Change or delete profile pictures with elegant initials badge fallback.
- **Full HD Apple Emojis Everywhere:** Renders 1,800+ authentic Apple HD Emojis across all chat bubbles and in the picker.
- **Sign In & Forgot Password:** Complete client-side authentication flow with demo credentials.

---

## 🚀 Running Locally

```bash
npm run dev
```
