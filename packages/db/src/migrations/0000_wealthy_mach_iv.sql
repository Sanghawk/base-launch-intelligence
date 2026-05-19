CREATE TYPE "public"."alert_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('new_high_score_launch', 'obvious_high_risk_launch');--> statement-breakpoint
CREATE TYPE "public"."confidence_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('unknown', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."triage_label" AS ENUM('Ignore', 'Risky', 'Watch', 'Research Deeper', 'High Priority');--> statement-breakpoint
CREATE TYPE "public"."worker_run_status" AS ENUM('running', 'success', 'partial_failure', 'failure');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"token_score_id" uuid,
	"alert_type" "alert_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"score_at_alert" numeric(6, 2),
	"reason_details" jsonb NOT NULL,
	"dedupe_key" text NOT NULL,
	"state_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	CONSTRAINT "alerts_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "deployer_history_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deployer_id" uuid NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"prior_contract_count" integer,
	"prior_token_count" integer,
	"prior_launch_count" integer,
	"internal_prior_seen_token_count" integer NOT NULL,
	"verified_contract_count" integer,
	"suspicious_prior_launch_count" integer,
	"repeated_template_confidence" "confidence_level",
	"history_confidence" "confidence_level" NOT NULL,
	"summary" text,
	"raw_payload_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"known_label" text,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deployers_chain_id_address_key" UNIQUE("chain_id","address")
);
--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"pool_id" uuid,
	"source" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"price_usd" numeric(38, 18),
	"liquidity_usd" numeric(38, 8),
	"fdv_usd" numeric(38, 8),
	"market_cap_usd" numeric(38, 8),
	"volume_5m_usd" numeric(38, 8),
	"volume_1h_usd" numeric(38, 8),
	"volume_6h_usd" numeric(38, 8),
	"volume_24h_usd" numeric(38, 8),
	"txns_5m_buys" integer,
	"txns_5m_sells" integer,
	"txns_1h_buys" integer,
	"txns_1h_sells" integer,
	"buyers_5m" integer,
	"sellers_5m" integer,
	"raw_payload_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"dex_id" text,
	"base_token_id" uuid NOT NULL,
	"base_token_address" text NOT NULL,
	"quote_token_address" text,
	"quote_token_symbol" text,
	"quote_token_name" text,
	"pair_created_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone NOT NULL,
	"source" text NOT NULL,
	"is_canonical_candidate" boolean DEFAULT false NOT NULL,
	"canonical_confidence" "confidence_level" DEFAULT 'low' NOT NULL,
	"canonical_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pools_chain_id_address_key" UNIQUE("chain_id","address")
);
--> statement-breakpoint
CREATE TABLE "risk_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"source" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"is_honeypot" boolean,
	"buy_tax" numeric(10, 4),
	"sell_tax" numeric(10, 4),
	"is_tax_modifiable" boolean,
	"has_blacklist" boolean,
	"has_whitelist" boolean,
	"can_mint" boolean,
	"owner_address" text,
	"ownership_renounced" boolean,
	"is_proxy" boolean,
	"is_verified" boolean,
	"top_holder_pct" numeric(10, 4),
	"top10_holder_pct" numeric(10, 4),
	"lp_locked_or_burned" boolean,
	"scanner_score" numeric(10, 4),
	"risk_level" "risk_level" DEFAULT 'unknown' NOT NULL,
	"risk_summary" text,
	"raw_payload_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_key" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"request_url" text,
	"request_params_hash" text,
	"response_status" integer,
	"duration_ms" integer,
	"raw_json" jsonb,
	"error" text,
	"error_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"canonical_pool_id" uuid,
	"market_snapshot_id" uuid,
	"risk_check_id" uuid,
	"deployer_history_snapshot_id" uuid,
	"scored_at" timestamp with time zone NOT NULL,
	"contract_risk_score" numeric(6, 2) NOT NULL,
	"liquidity_quality_score" numeric(6, 2) NOT NULL,
	"deployer_history_score" numeric(6, 2) NOT NULL,
	"overall_score" numeric(6, 2) NOT NULL,
	"triage_label" "triage_label" NOT NULL,
	"confidence" "confidence_level" NOT NULL,
	"reason_summary" text NOT NULL,
	"reason_details" jsonb NOT NULL,
	"critical_flags" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"name" text,
	"symbol" text,
	"decimals" integer,
	"total_supply_raw" numeric(78, 0),
	"first_seen_at" timestamp with time zone NOT NULL,
	"first_seen_source" text NOT NULL,
	"deployer_id" uuid,
	"deployer_address" text,
	"creation_tx_hash" text,
	"created_at_block" bigint,
	"created_at_timestamp" timestamp with time zone,
	"is_verified" boolean,
	"is_proxy" boolean,
	"metadata_confidence" "confidence_level" DEFAULT 'low' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_chain_id_address_key" UNIQUE("chain_id","address")
);
--> statement-breakpoint
CREATE TABLE "worker_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "worker_run_status" NOT NULL,
	"candidates_fetched" integer DEFAULT 0 NOT NULL,
	"tokens_inserted" integer DEFAULT 0 NOT NULL,
	"tokens_updated" integer DEFAULT 0 NOT NULL,
	"pools_inserted" integer DEFAULT 0 NOT NULL,
	"pools_updated" integer DEFAULT 0 NOT NULL,
	"market_snapshots_inserted" integer DEFAULT 0 NOT NULL,
	"risk_checks_inserted" integer DEFAULT 0 NOT NULL,
	"deployer_snapshots_inserted" integer DEFAULT 0 NOT NULL,
	"scores_computed" integer DEFAULT 0 NOT NULL,
	"alerts_created" integer DEFAULT 0 NOT NULL,
	"provider_error_count" integer DEFAULT 0 NOT NULL,
	"error_summary" text,
	"error_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_token_score_id_token_scores_id_fk" FOREIGN KEY ("token_score_id") REFERENCES "public"."token_scores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployer_history_snapshots" ADD CONSTRAINT "deployer_history_snapshots_deployer_id_deployers_id_fk" FOREIGN KEY ("deployer_id") REFERENCES "public"."deployers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployer_history_snapshots" ADD CONSTRAINT "deployer_history_snapshots_raw_payload_id_source_observations_id_fk" FOREIGN KEY ("raw_payload_id") REFERENCES "public"."source_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_raw_payload_id_source_observations_id_fk" FOREIGN KEY ("raw_payload_id") REFERENCES "public"."source_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_base_token_id_tokens_id_fk" FOREIGN KEY ("base_token_id") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_checks" ADD CONSTRAINT "risk_checks_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_checks" ADD CONSTRAINT "risk_checks_raw_payload_id_source_observations_id_fk" FOREIGN KEY ("raw_payload_id") REFERENCES "public"."source_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_scores" ADD CONSTRAINT "token_scores_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_scores" ADD CONSTRAINT "token_scores_canonical_pool_id_pools_id_fk" FOREIGN KEY ("canonical_pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_scores" ADD CONSTRAINT "token_scores_market_snapshot_id_market_snapshots_id_fk" FOREIGN KEY ("market_snapshot_id") REFERENCES "public"."market_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_scores" ADD CONSTRAINT "token_scores_risk_check_id_risk_checks_id_fk" FOREIGN KEY ("risk_check_id") REFERENCES "public"."risk_checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_scores" ADD CONSTRAINT "token_scores_deployer_history_snapshot_id_deployer_history_snapshots_id_fk" FOREIGN KEY ("deployer_history_snapshot_id") REFERENCES "public"."deployer_history_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_deployer_id_deployers_id_fk" FOREIGN KEY ("deployer_id") REFERENCES "public"."deployers"("id") ON DELETE no action ON UPDATE no action;