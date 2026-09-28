/**
 * Local preview content source.
 *
 * SAMPLE CONTENT FOR LOCAL PREVIEW ONLY. The questions, answers, result copy and red flags below
 * were written so the app runs with `pnpm dev` without Supabase (CONTENT_SOURCE=fixture, or
 * automatically in development when NEXT_PUBLIC_SUPABASE_URL is unset). They mirror the bundled
 * illustrations in public/images/scenarios/question-{1..10} and the red flags drawn into them,
 * but they are NOT the campaign's approved copy: the real content lives in the database (or the
 * CMS) and is never read from this file in production unless CONTENT_SOURCE=fixture is set.
 */

import {
	LEGACY_PIN_RED_FLAG,
	LEGACY_PIN_SCENARIO,
	LEGACY_QUIZ_META,
	legacyScenarioImagePaths,
} from "@/lib/content/legacy";
import { isValidQuizSlug } from "@/lib/content/schema";
import {
	DEFAULT_QUIZ_SLUG,
	finalizeQuiz,
	type ContentSource,
} from "@/lib/content/source";
import type {
	Answer,
	KpiCategory,
	Question,
	Quiz,
	QuizSummary,
	RedFlag,
	Scenario,
} from "@/lib/content/types";

type SampleQuestion = {
	category: string;
	kpiCategory: KpiCategory;
	prompt: string;
	/** The PIN screen, or the question-{n} image pair with this alt text. */
	scene: "pin-entry" | { alt: string };
	/** [text, isCorrect] */
	answers: [string, boolean][];
	correctTitle: string;
	header: string;
	explanation: string;
	/** [label, detail] — the image-pair flags are drawn into result.svg, so they carry no x/y. */
	redFlags: [string, string?][];
};

const SAMPLE_QUESTIONS: SampleQuestion[] = [
	{
		category: "หลอกให้กรอกรหัส",
		kpiCategory: "PROTECTIVE_ACTIONS",
		prompt:
			"คุณกดลิงก์ในข้อความที่แจ้งว่าได้รับเงินช่วยเหลือ แล้วหน้าเว็บขอให้กรอกรหัส PIN 6 หลักเพื่อยืนยันตัวตน คุณจะทำอย่างไร",
		scene: "pin-entry",
		answers: [
			["ไม่กรอกรหัส", true],
			["ยืนยัน", false],
		],
		correctTitle: "ถูกต้อง คุณไม่กรอกรหัส",
		header: "รหัส PIN ห้ามกรอกบนหน้าเว็บจากลิงก์",
		explanation:
			"ธนาคารและหน่วยงานรัฐไม่ขอรหัส PIN หรือรหัส OTP ผ่านลิงก์ในข้อความ หน้าเว็บแบบนี้มักเป็นหน้าปลอมที่เก็บรหัสไปใช้โอนเงินออกจากบัญชีของคุณ หากเผลอกรอกไปแล้ว ให้โทรหาธนาคารเพื่ออายัดบัญชีทันที และแจ้งสายด่วน 1441",
		redFlags: [[LEGACY_PIN_RED_FLAG.label, LEGACY_PIN_RED_FLAG.detail]],
	},
	{
		category: "แก๊งคอลเซ็นเตอร์",
		kpiCategory: "RESPONSE_STRATEGIES",
		prompt:
			"มีสายเรียกเข้าจากเบอร์ +6972543130 ปลายสายอ้างว่าเป็นตำรวจ แจ้งว่าบัญชีของคุณพัวพันคดีฟอกเงิน และสั่งให้โอนเงินไปตรวจสอบ คุณจะทำอย่างไร",
		scene: {
			alt: "หน้าจอสายเรียกเข้าจากเบอร์ +6972543130 ที่คุยมาแล้ว 1 นาที 45 วินาที",
		},
		answers: [
			["โอนเงินไปให้ตรวจสอบก่อน เพราะไม่อยากมีคดี", false],
			["วางสาย แล้วโทรสอบถามสถานีตำรวจหรือสายด่วน 1441 ด้วยตัวเอง", true],
			["ให้เลขบัญชีไปก่อน แล้วค่อยถามรายละเอียดทีหลัง", false],
		],
		correctTitle: "ถูกต้อง วางสายแล้วตรวจสอบเอง",
		header: "ตำรวจจริงไม่โทรมาสั่งให้โอนเงิน",
		explanation:
			"เบอร์ที่ขึ้นต้นด้วย + ตามด้วยรหัสประเทศอื่นคือสายจากต่างประเทศ ตำรวจจริงไม่แจ้งข้อกล่าวหาทางโทรศัพท์หรือแชท และไม่มีขั้นตอนให้โอนเงินไปตรวจสอบ เมื่อไม่แน่ใจ ให้วางสายแล้วโทรกลับหน่วยงานจากเบอร์ทางการ หรือโทรสายด่วน 1441",
		redFlags: [
			[
				"เบอร์แปลกโทรจากต่างประเทศ",
				"ลองวางสายแล้วโทรกลับ หากโทรไม่ติด มักเป็นมิจฉาชีพ",
			],
			["ตำรวจจริงจะไม่โทรหรือแชทมาแจ้งข้อกล่าวหา"],
		],
	},
	{
		category: "เงินกู้ออนไลน์เถื่อน",
		kpiCategory: "SCAM_RECOGNITION",
		prompt:
			"คุณเห็นโฆษณาเงินกู้บนโซเชียลว่า “ไม่ตรวจสอบเครดิต ไม่ต้องใช้เอกสาร ดอกน้อย ผ่อนสบาย” คุณจะทำอย่างไร",
		scene: {
			alt: "โพสต์โฆษณาเงินกู้บนโซเชียล: ไม่ตรวจสอบเครดิต ไม่ต้องใช้เอกสารใดๆ ดอกน้อย ผ่อนสบาย",
		},
		answers: [
			["ทักไปสมัครทันที เพราะอนุมัติง่ายและได้เงินเร็ว", false],
			["ไม่ทักไป และกู้กับสถาบันการเงินที่ได้รับอนุญาตเท่านั้น", true],
			["ส่งเอกสารไปลองก่อน ถ้าไม่ผ่านค่อยหาที่ใหม่", false],
		],
		correctTitle: "ถูกต้อง คุณไม่หลงเงื่อนไขง่ายเกินจริง",
		header: "เงินกู้ที่ง่ายเกินจริงคือกับดัก",
		explanation:
			"สถาบันการเงินที่ได้รับอนุญาตต้องตรวจสอบเอกสารและเครดิตก่อนอนุมัติเสมอ โฆษณาที่ไม่บอกอัตราดอกเบี้ยชัดเจนมักเรียกเก็บค่าธรรมเนียมก่อนปล่อยกู้ หรือคิดดอกเบี้ยเกินกฎหมาย หากไม่แน่ใจว่าผู้ให้กู้ได้รับอนุญาตหรือไม่ สอบถาม ธปท. ได้ที่ 1213",
		redFlags: [
			[
				"เงื่อนไขง่ายเกินจริง",
				"สถาบันการเงินจริงต้องตรวจสอบ ขอเอกสาร และใช้เวลาในการอนุมัติ",
			],
			[
				"ไม่ระบุอัตราดอกเบี้ยที่ชัดเจน",
				"มักแอบแฝงค่าธรรมเนียม และคิดดอกเบี้ยเกินกฎหมายกำหนด",
			],
		],
	},
	{
		category: "หลอกทำงานออนไลน์",
		kpiCategory: "SCAM_RECOGNITION",
		prompt:
			"โพสต์รับสมัครงานบอกว่า “ไม่ต้องมีประสบการณ์ ทำงานที่บ้านวันละ 1–2 ชั่วโมง การันตีรายได้ 500–1,000 บาทต่อวัน” และให้รีบสมัครเพราะรับจำนวนจำกัด คุณจะทำอย่างไร",
		scene: {
			alt: "โพสต์รับสมัครด่วน จำนวนจำกัด การันตีรายได้ 500–1,000 บาทต่อวัน ค่าคอมมิชชันสูง 30%",
		},
		answers: [
			["รีบสมัครก่อนเต็ม แล้วค่อยถามรายละเอียด", false],
			["ไม่สมัคร เพราะรายได้สูงเกินจริงเมื่อเทียบกับงาน", true],
			["สมัครได้ ถ้ายังไม่ต้องจ่ายค่าสมัคร", false],
		],
		correctTitle: "ถูกต้อง งานนี้ดีเกินจริง",
		header: "งานง่าย รายได้สูง ให้รีบสมัคร คือธงแดง",
		explanation:
			"มิจฉาชีพใช้งานออนไลน์ที่ดูง่ายเพื่อหลอกให้คุณโอนค่าสมัคร ค่าอุปกรณ์ หรือเติมเงินเพื่อทำภารกิจ ก่อนสมัครงานใด ให้ตรวจสอบชื่อบริษัทและช่องทางติดต่อทางการ และไม่โอนเงินเพื่อแลกกับงาน",
		redFlags: [
			["ข้อความเร่งรัดให้รีบตัดสินใจ", "ให้สมัครโดยไม่ได้ไตร่ตรอง"],
			[
				"อ้างว่าไม่ต้องมีประสบการณ์ ทำที่บ้านได้",
				"เพื่อดึงดูดคนที่ต้องการหารายได้เสริม",
			],
			["รายได้สูงเกินจริง", "ไม่สอดคล้องกับลักษณะงานและคุณสมบัติ"],
		],
	},
	{
		category: "หลอกลงทุน",
		kpiCategory: "RISK_ASSESSMENT",
		prompt:
			"โฆษณาชวนลงทุนมีภาพนักธุรกิจดูน่าเชื่อถือ บอกว่า “ลงทุนง่าย การันตีผลตอบแทนสูง มือใหม่ก็ลงทุนได้ มีผู้เชี่ยวชาญแนะนำ” คุณจะทำอย่างไร",
		scene: {
			alt: "โฆษณาชวนลงทุน: ลงทุนง่าย การันตีผลตอบแทนสูง มือใหม่ก็ลงทุนได้ มีผู้เชี่ยวชาญแนะนำ",
		},
		answers: [
			["ลงเงินก้อนเล็กก่อน ถ้าได้กำไรจริงค่อยเพิ่ม", false],
			["ไม่ลงทุน และตรวจสอบรายชื่อผู้ได้รับอนุญาตกับ ก.ล.ต. ก่อนเสมอ", true],
			["เชื่อได้ เพราะมีผู้เชี่ยวชาญและคนดังรับรอง", false],
		],
		correctTitle: "ถูกต้อง ไม่มีใครการันตีผลตอบแทนได้",
		header: "ไม่มีการลงทุนใดการันตีผลตอบแทน",
		explanation:
			"ผลตอบแทนยิ่งสูง ความเสี่ยงยิ่งสูง การันตีกำไรจึงเป็นสัญญาณหลอกลวง มิจฉาชีพมักจ่ายกำไรรอบแรกให้คุณไว้ใจ แล้วชวนเพิ่มเงินก้อนใหญ่ ก่อนลงทุนทุกครั้ง ให้ตรวจสอบรายชื่อผู้ได้รับอนุญาตกับ ก.ล.ต.",
		redFlags: [
			["ไม่มีการลงทุนใด “การันตีผลตอบแทน” ได้แน่นอน", "ยิ่งกำไรสูง ยิ่งเสี่ยงสูง"],
			["แอบอ้างชื่อบุคคลดังหรือบริษัท", "เพื่อเพิ่มความน่าเชื่อถือ"],
			[
				"อ้างว่า “มีผู้เชี่ยวชาญแนะนำ”",
				"เพื่อดึงดูดมือใหม่ ทั้งที่อาจเป็นแค่หน้าม้า",
			],
		],
	},
	{
		category: "หลอกให้รักออนไลน์",
		kpiCategory: "RISK_ASSESSMENT",
		prompt:
			"มีคนแปลกหน้าส่งคำขอเป็นเพื่อนมา โปรไฟล์หน้าตาดี ดูมีฐานะ แต่มีเพื่อนเพียง 5 คน คุณจะทำอย่างไร",
		scene: {
			alt: "โปรไฟล์โซเชียลของชายหน้าตาดีที่มีภาพรถหรูเป็นภาพปก และมีเพื่อนเพียง 5 คน",
		},
		answers: [
			["รับเป็นเพื่อน เพราะหน้าตาดีและดูมีฐานะ", false],
			["ไม่รับ เพราะไม่รู้จักตัวจริง และโปรไฟล์เพิ่งสร้าง", true],
			["รับไว้ก่อน ถ้าเขาขอเงินค่อยบล็อก", false],
		],
		correctTitle: "ถูกต้อง โปรไฟล์นี้น่าสงสัย",
		header: "โปรไฟล์ดีเกินจริง แต่เพิ่งสร้าง",
		explanation:
			"มิจฉาชีพมักใช้รูปคนหน้าตาดีที่ขโมยมา สร้างบัญชีใหม่ที่มีเพื่อนและโพสต์น้อย แล้วใช้เวลาหลายสัปดาห์สร้างความสนิทใจ ก่อนชวนลงทุนหรือขอยืมเงิน อย่าโอนเงินให้คนที่ไม่เคยพบตัวจริง",
		redFlags: [
			["โปรไฟล์ดูดีเกินจริง", "สมบูรณ์แบบเหมือนดารา"],
			["โปรไฟล์เพิ่งสร้าง", "มีจำนวนเพื่อนและโพสต์น้อย"],
		],
	},
	{
		category: "เพจปลอมแอบอ้างตำรวจ",
		kpiCategory: "SCAM_RECOGNITION",
		prompt:
			"คุณเห็นโฆษณาจากเพจที่ใช้ภาพเจ้าหน้าที่ตำรวจ บอกว่า “หากคุณตกเป็นเหยื่อมิจฉาชีพ ติดต่อรับเงินคืนจากการยึดทรัพย์กว่า 100 ล้านบาท” คุณจะทำอย่างไร",
		scene: {
			alt: "โฆษณาจากเพจที่ใช้ภาพตำรวจ ชวนผู้เสียหายจากมิจฉาชีพลงทะเบียนรับเงินคืน",
		},
		answers: [
			["ลงทะเบียนรับเงินคืนทันที เพราะเป็นเพจตำรวจ", false],
			["ไม่กดลิงก์ และติดตามเรื่องผ่านช่องทางทางการ เช่น สายด่วน 1441", true],
			["ทักแชทไปถามรายละเอียดกับแอดมินเพจก่อน", false],
		],
		correctTitle: "ถูกต้อง เพจนี้ไม่ใช่ของตำรวจ",
		header: "หน่วยงานราชการไม่ซื้อโฆษณาชวนรับเงินคืน",
		explanation:
			"มิจฉาชีพซ้ำเติมผู้เสียหายด้วยเพจปลอมที่อ้างว่าช่วยตามเงินคืน แล้วเรียกเก็บค่าดำเนินการ การติดตามเงินคืนทำผ่านช่องทางทางการ เช่น แจ้งความที่ thaipoliceonline.go.th หรือโทรสายด่วน 1441 และไม่มีการเรียกเก็บเงินจากคุณ",
		redFlags: [
			["เพจหน่วยงานราชการไม่ซื้อโฆษณา"],
			["ใช้ข้อความกระตุ้นความรู้สึก", "เร่งด่วน หรือให้ความหวัง"],
			["แอบอ้างใช้ภาพบุคคลสำคัญหรือเจ้าหน้าที่ตำรวจ"],
		],
	},
	{
		category: "โอนเข้าบัญชีม้า",
		kpiCategory: "PROTECTIVE_ACTIONS",
		prompt:
			"คุณสั่งซื้อสินค้าออนไลน์ แอดมินร้านส่งช่องทางชำระเงินมาเป็นบัญชี Obank ชื่อ “มิชชา ยิ่งชีพ” เลขบัญชี 998-761-45 และให้โอนแล้วแจ้งสลิป คุณจะทำอย่างไร",
		scene: {
			alt: "แชทกับแอดมินร้านค้าที่ส่งช่องทางชำระเงิน ธนาคาร Obank ชื่อบัญชีมิชชา ยิ่งชีพ เลขบัญชี 998-761-45",
		},
		answers: [
			["โอนเลย เพราะแอดมินตอบไวและดูเป็นทางการ", false],
			["ยังไม่โอน ตรวจสอบก่อนว่าชื่อบัญชีตรงกับชื่อร้านหรือบริษัท", true],
			["โอนครึ่งหนึ่งก่อน ที่เหลือจ่ายเมื่อได้ของ", false],
		],
		correctTitle: "ถูกต้อง ชื่อบัญชีไม่ตรงกับร้าน",
		header: "ชื่อบัญชีผู้รับต้องตรงกับชื่อร้าน",
		explanation:
			"ร้านค้าที่จดทะเบียนมักรับเงินเข้าบัญชีในนามร้านหรือบริษัท ถ้าชื่อผู้รับเป็นบุคคลที่ไม่เกี่ยวกับร้าน อาจเป็นบัญชีม้าที่มิจฉาชีพใช้รับเงิน ก่อนโอน ให้ตรวจสอบชื่อและเลขบัญชี และเลือกช่องทางชำระเงินที่มีระบบคุ้มครองผู้ซื้อ",
		redFlags: [
			["ชื่อบัญชีผู้รับโอนเป็นบุคคลธรรมดา", "ไม่ตรงกับชื่อร้านหรือบริษัท"],
		],
	},
	{
		category: "SMS หลอกลวง",
		kpiCategory: "PROTECTIVE_ACTIONS",
		prompt:
			"คุณได้รับ SMS ว่า “พัสดุของท่านเกิดการเสียหาย กรุณายื่นเคสเคลมค่าเสียหาย” พร้อมลิงก์ bit.ly/49dvdnhm คุณจะทำอย่างไร",
		scene: {
			alt: "SMS จากผู้ส่งที่ไม่รู้จัก แจ้งว่าพัสดุเสียหาย ให้ยื่นเคลมผ่านลิงก์ bit.ly/49dvdnhm",
		},
		answers: [
			["กดลิงก์เพื่อยื่นเคลม เพราะกำลังรอพัสดุอยู่พอดี", false],
			["ไม่กดลิงก์ และเช็กสถานะพัสดุในแอปหรือเว็บไซต์ทางการของขนส่งเอง", true],
			["ตอบกลับ SMS เพื่อถามว่าเป็นพัสดุอะไร", false],
		],
		correctTitle: "ถูกต้อง คุณไม่กดลิงก์",
		header: "ลิงก์ใน SMS ที่คุณไม่ได้ขอ อย่ากด",
		explanation:
			"ลิงก์ย่อแบบนี้ซ่อนปลายทางที่แท้จริง เมื่อกดแล้วอาจพาไปเพิ่มเพื่อนกับบัญชีปลอมในแอปแชต หรือหลอกให้ติดตั้งแอปที่ควบคุมโทรศัพท์ของคุณ ให้ตรวจสอบสถานะพัสดุผ่านแอปหรือเว็บไซต์ทางการของบริษัทขนส่งเท่านั้น",
		redFlags: [["มีลิงก์แนบมา", "เมื่อคลิกจะเป็นการเพิ่มเพื่อนในแอปแชต"]],
	},
	{
		category: "หลอกเข้ากลุ่มแชท",
		kpiCategory: "RESPONSE_STRATEGIES",
		prompt:
			"คุณขายของออนไลน์ มีลูกค้าทักมาถามว่ายังมีของไหม แล้วบอกว่าคนในกลุ่มสนใจ ชวนคุณเข้าโอเพนแชท “Ship Shop” เพื่อลงขาย คุณจะทำอย่างไร",
		scene: {
			alt: "แชทจากลูกค้าที่ถามว่ายังมีของไหม แล้วส่งคำเชิญเข้าโอเพนแชท Ship Shop",
		},
		answers: [
			["เข้ากลุ่มทันที เพราะอาจขายได้หลายชิ้น", false],
			["ไม่เข้ากลุ่ม และขอให้ลูกค้าสั่งซื้อผ่านช่องทางปกติของร้าน", true],
			["เข้ากลุ่มไปดูก่อน ถ้าไม่ดีค่อยออก", false],
		],
		correctTitle: "ถูกต้อง ลูกค้าจริงไม่ชวนเข้ากลุ่ม",
		header: "ลูกค้าจริงโอนเงินซื้อ ไม่ชวนเข้ากลุ่ม",
		explanation:
			"กลุ่มแชทแบบนี้มักมีหน้าม้าคอยเล่าว่าขายได้กำไร แล้วชวนคุณสมัครเป็นตัวแทน จ่ายค่าส่งสินค้า หรือโอนเงินค้ำประกันก่อน ลูกค้าที่สนใจจริงจะสั่งซื้อและชำระเงินผ่านช่องทางของร้าน หากเผลอโอนเงินไปแล้ว ให้โทรสายด่วน 1441 ทันที",
		redFlags: [["เสนอให้เข้ากลุ่ม", "แทนที่จะโอนเงินซื้อสินค้า"]],
	},
];

function sampleScenario(sample: SampleQuestion, order: number): Scenario {
	if (sample.scene === "pin-entry") return { ...LEGACY_PIN_SCENARIO };
	return { kind: "image-pair", ...legacyScenarioImagePaths(order), alt: sample.scene.alt };
}

function sampleQuestion(sample: SampleQuestion, index: number): Question {
	const order = index + 1;
	const id = `sample-q${String(order).padStart(2, "0")}`;
	const answers: Answer[] = sample.answers.map(([text, isCorrect], answerIndex) => ({
		id: `${id}-a${answerIndex + 1}`,
		text,
		isCorrect,
	}));
	const redFlags: RedFlag[] = sample.redFlags.map(([label, detail], flagIndex) => ({
		number: flagIndex + 1,
		label,
		...(detail ? { detail } : {}),
	}));
	return {
		id,
		order,
		prompt: sample.prompt,
		category: sample.category,
		kpiCategory: sample.kpiCategory,
		scenario: sampleScenario(sample, order),
		answers,
		result: {
			correctTitle: sample.correctTitle,
			// Never shame a wrong answer: name what there was to spot instead (SPEC §6).
			wrongTitle: `ข้อนี้มีธงแดง ${redFlags.length} จุด`,
			header: sample.header,
			explanation: sample.explanation,
		},
		redFlags,
	};
}

/** The default quiz with the sample questions. */
export const SAMPLE_QUIZ: Quiz = {
	...LEGACY_QUIZ_META,
	questions: SAMPLE_QUESTIONS.map(sampleQuestion),
};

/** Serves SAMPLE_QUIZ (see the header comment). */
export class FixtureContentSource implements ContentSource {
	readonly name = "fixture";

	async getQuiz(slug: string): Promise<Quiz | null> {
		if (!isValidQuizSlug(slug) || slug !== DEFAULT_QUIZ_SLUG) return null;
		// Validation parses into a fresh copy, so no caller can mutate what the next one gets.
		return finalizeQuiz(this.name, slug, SAMPLE_QUIZ);
	}

	async listQuizzes(): Promise<QuizSummary[]> {
		const { questions, ...meta } = SAMPLE_QUIZ;
		return [{ ...meta, questionCount: questions.length }];
	}
}
