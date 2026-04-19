/**
 * QURABIA LingBot-Map Service Client
 * TypeScript integration for LingBot Arabic NLP service
 *
 * @author عبدالعزيز بن سلطان العتيبي
 * @version 1.0.0
 */

const LINGBOT_API_URL =
	import.meta.env.VITE_LINGBOT_API_URL || "http://localhost:10001";

// ══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

export interface SentimentAnalysis {
	polarity: "positive" | "negative" | "neutral";
	score: number;
	confidence: number;
}

export interface NamedEntity {
	text: string;
	type: string;
	start: number;
	end: number;
}

export interface AnalyzeTextRequest {
	text: string;
	include_sentiment?: boolean;
	include_entities?: boolean;
	include_topics?: boolean;
}

export interface AnalyzeTextResponse {
	text_length: number;
	language: string;
	sentiment: SentimentAnalysis | null;
	entities: NamedEntity[] | null;
	topics: string[] | null;
	processing_time_ms: number;
}

export interface SummarizeTextRequest {
	text: string;
	max_length?: number;
	style?: "extractive" | "abstractive";
}

export interface SummarizeTextResponse {
	summary: string;
	original_length: number;
	summary_length: number;
	compression_ratio: number;
	processing_time_ms: number;
}

export interface HealthResponse {
	status: string;
	service: string;
	version: string;
	environment: string;
	timestamp: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// API CLIENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * LingBot-Map API Client
 */
export class LingBotClient {
	private baseUrl: string;

	constructor(baseUrl: string = LINGBOT_API_URL) {
		this.baseUrl = baseUrl;
	}

	/**
	 * Check service health
	 */
	async health(): Promise<HealthResponse> {
		const response = await fetch(`${this.baseUrl}/health`);

		if (!response.ok) {
			throw new Error(`Health check failed: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Analyze Arabic text
	 * تحليل نص عربي
	 */
	async analyzeText(
		request: AnalyzeTextRequest,
	): Promise<AnalyzeTextResponse> {
		const response = await fetch(`${this.baseUrl}/api/lingbot/analyze`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Text analysis failed: ${error.detail || response.statusText}`,
			);
		}

		return response.json();
	}

	/**
	 * Summarize Arabic text
	 * تلخيص نص عربي
	 */
	async summarizeText(
		request: SummarizeTextRequest,
	): Promise<SummarizeTextResponse> {
		const response = await fetch(`${this.baseUrl}/api/lingbot/summarize`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Summarization failed: ${error.detail || response.statusText}`,
			);
		}

		return response.json();
	}
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Quick sentiment analysis
 * تحليل سريع للمشاعر
 */
export async function analyzeSentiment(
	text: string,
): Promise<SentimentAnalysis | null> {
	const client = new LingBotClient();
	const result = await client.analyzeText({
		text,
		include_sentiment: true,
		include_entities: false,
		include_topics: false,
	});
	return result.sentiment;
}

/**
 * Quick text summarization
 * تلخيص سريع للنص
 */
export async function summarize(
	text: string,
	maxLength = 150,
): Promise<string> {
	const client = new LingBotClient();
	const result = await client.summarizeText({ text, max_length: maxLength });
	return result.summary;
}

/**
 * Extract named entities
 * استخراج الكيانات
 */
export async function extractEntities(
	text: string,
): Promise<NamedEntity[] | null> {
	const client = new LingBotClient();
	const result = await client.analyzeText({
		text,
		include_sentiment: false,
		include_entities: true,
		include_topics: false,
	});
	return result.entities;
}

/**
 * Extract topics
 * استخراج المواضيع
 */
export async function extractTopics(text: string): Promise<string[] | null> {
	const client = new LingBotClient();
	const result = await client.analyzeText({
		text,
		include_sentiment: false,
		include_entities: false,
		include_topics: true,
	});
	return result.topics;
}

// Default export
export default LingBotClient;
