-- Removes every demo account and everything attached to it. Safe to run any time.
DELETE FROM couples WHERE partner_a_id IN (SELECT id FROM profiles WHERE email LIKE '%@demo.covenant.test');
DELETE FROM assessments WHERE participant_id IN (SELECT id FROM profiles WHERE email LIKE '%@demo.covenant.test');
DELETE FROM fruit_reflections WHERE participant_id IN (SELECT id FROM profiles WHERE email LIKE '%@demo.covenant.test');
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@demo.covenant.test');
DELETE FROM auth.users WHERE email LIKE '%@demo.covenant.test';
