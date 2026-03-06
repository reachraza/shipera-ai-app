import { google, gmail_v1 } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function getGmailClient() {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
        throw new Error('GOOGLE_REFRESH_TOKEN is not configured in .env.local');
    }

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
}

export interface ParsedGmailMessage {
    id: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    bodyHtml: string;
    bodyText: string;
    messageId: string;
    inReplyTo?: string;
    references?: string[];
    attachments: { filename: string; mimeType: string; data: string; attachmentId: string }[];
}

/**
 * Parses a Gmail message into a cleaner format.
 */
export async function parseGmailMessage(message: gmail_v1.Schema$Message): Promise<ParsedGmailMessage> {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: gmail_v1.Schema$MessagePartHeader) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    let bodyHtml = '';
    let bodyText = '';
    const attachments: { filename: string; mimeType: string; data: string; attachmentId: string }[] = [];

    const extractPart = (part: gmail_v1.Schema$MessagePart) => {
        // Handle attachments
        if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
            attachments.push({
                filename: part.filename,
                mimeType: part.mimeType || 'application/octet-stream',
                attachmentId: part.body.attachmentId,
                data: '' // Will be populated in fetchUnreadGmailMessages
            });
        } else if (part.body?.data) {
            // Handle body text
            const data = Buffer.from(part.body.data, 'base64').toString('utf-8');
            if (part.mimeType === 'text/html') {
                bodyHtml += data;
            } else if (part.mimeType === 'text/plain') {
                bodyText += data;
            }
        }

        if (part.parts) {
            part.parts.forEach(extractPart);
        }
    };

    if (message.payload) {
        extractPart(message.payload);
    }

    const references = getHeader('References');

    return {
        id: message.id!,
        threadId: message.threadId!,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        messageId: getHeader('Message-ID'),
        inReplyTo: getHeader('In-Reply-To'),
        references: references ? references.split(/\s+/).filter(Boolean) : [],
        bodyHtml,
        bodyText,
        attachments,
    };
}

/**
 * Lists unread messages and parses them.
 */
export async function fetchUnreadGmailMessages(limit = 10) {
    const gmail = await getGmailClient();

    const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: limit,
    });

    const messages = response.data.messages || [];
    console.log(`[Gmail Service] API returned ${messages.length} messages for query "${response.config.params?.q}"`);
    const parsedMessages: ParsedGmailMessage[] = [];

    for (const m of messages) {
        const fullMsg = await gmail.users.messages.get({
            userId: 'me',
            id: m.id!,
        });

        const parsed = await parseGmailMessage(fullMsg.data);

        // Fetch actual attachment payloads if present
        for (const attachment of parsed.attachments) {
            try {
                const attRes = await gmail.users.messages.attachments.get({
                    userId: 'me',
                    messageId: parsed.id,
                    id: attachment.attachmentId
                });

                if (attRes.data.data) {
                    attachment.data = attRes.data.data;
                }
            } catch (attErr) {
                console.error(`[Gmail Service] Failed to fetch attachment ${attachment.filename}:`, attErr);
            }
        }

        parsedMessages.push(parsed);
    }

    return parsedMessages;
}

/**
 * Marks a message as read (removes UNREAD label).
 */
export async function markAsRead(messageId: string) {
    const gmail = await getGmailClient();
    await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
            removeLabelIds: ['UNREAD'],
        },
    });
}
