CREATE INDEX "raw_input_user_idx" ON "raw_inputs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "raw_input_session_idx" ON "raw_inputs" USING btree ("session_id");