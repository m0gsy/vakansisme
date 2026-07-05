-- Settings page now lets users manage a contact phone number alongside email.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
