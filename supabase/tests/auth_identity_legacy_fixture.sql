insert into public.users(id,clerk_user_id,email,role) values('00000000-0000-4000-8000-000000000001','legacy-test-owner','owner@example.test','superadmin');
insert into public.quiz_attempts(clerk_user_id,clerk_user_email) values('legacy-test-owner','owner@example.test');
insert into public.subscriptions(clerk_id) values('legacy-test-owner');
insert into public.entitlements(user_id) values('legacy-test-owner');
