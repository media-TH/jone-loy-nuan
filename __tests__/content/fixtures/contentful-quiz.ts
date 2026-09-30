/**
 * A Contentful Content Delivery API response for one quiz (GET /entries?content_type=quiz&include=3),
 * trimmed to the fields the mapping reads plus the usual sys noise.
 */

const link = (linkType: "Entry" | "Asset", id: string) => ({ sys: { type: "Link", linkType, id } });

const entry = (contentType: string, id: string, fields: Record<string, unknown>, revision = 1) => ({
	metadata: { tags: [] },
	sys: {
		space: { sys: { type: "Link", linkType: "Space", id: "space123" } },
		id,
		type: "Entry",
		createdAt: "2026-09-01T00:00:00.000Z",
		updatedAt: "2026-09-20T00:00:00.000Z",
		environment: { sys: { id: "master", type: "Link", linkType: "Environment" } },
		revision,
		contentType: { sys: { type: "Link", linkType: "ContentType", id: contentType } },
		locale: "th",
	},
	fields,
});

const asset = (id: string, fileName: string, description: string) => ({
	metadata: { tags: [] },
	sys: { id, type: "Asset", revision: 1, locale: "th" },
	fields: {
		title: fileName,
		description,
		file: {
			url: `//images.ctfassets.net/space123/${id}/0a1b2c/${fileName}`,
			details: { size: 1024, image: { width: 640, height: 640 } },
			fileName,
			contentType: "image/svg+xml",
		},
	},
});

export const CONTENTFUL_QUIZ_RESPONSE = {
	sys: { type: "Array" },
	total: 1,
	skip: 0,
	limit: 1,
	items: [
		entry(
			"quiz",
			"quizEntry",
			{
				slug: "scam-awareness",
				title: "แบบทดสอบ 10 สถานการณ์จำลอง",
				description: "ดูสถานการณ์จำลอง แล้วหาธงแดง",
				// List order differs from `order` on purpose; unresolvable and broken entries included.
				questions: [
					link("Entry", "qCall"),
					link("Entry", "qPin"),
					link("Entry", "qUnpublished"),
					link("Entry", "qBroken"),
					link("Entry", "qSms"),
				],
			},
			7,
		),
	],
	includes: {
		Entry: [
			entry("question", "qPin", {
				order: 1,
				prompt: "หน้าเว็บขอรหัส PIN 6 หลัก คุณจะทำอย่างไร",
				category: "หลอกให้กรอกรหัส",
				kpiCategory: "PROTECTIVE_ACTIONS",
				scenario: { kind: "pin-entry", pinLength: 6, prompt: "กรุณากรอกรหัสผ่าน" },
				answers: [link("Entry", "aPinCancel"), link("Entry", "aPinConfirm")],
				correctTitle: "ถูกต้อง",
				wrongTitle: "ข้อนี้มีธงแดง 1 จุด",
				header: "อย่ากรอกรหัสจากลิงก์",
				explanation: "ธนาคารไม่ขอรหัส PIN ผ่านลิงก์",
				redFlags: [link("Entry", "rfPin")],
			}),
			entry("question", "qCall", {
				order: 2,
				prompt: "มีสายจากเบอร์ +6972543130 อ้างเป็นตำรวจ คุณจะทำอย่างไร",
				category: "แก๊งคอลเซ็นเตอร์",
				kpiCategory: "RESPONSE_STRATEGIES",
				normalImage: link("Asset", "imgNormal"),
				resultImage: link("Asset", "imgResult"),
				imageAlt: "หน้าจอสายเรียกเข้าจากเบอร์ +6972543130",
				// Ignored: the images win.
				scenario: { kind: "call", caller: "ไม่ทราบชื่อ", number: "+6972543130" },
				answers: [link("Entry", "aCallPay"), link("Entry", "aCallHangUp"), link("Asset", "imgNormal")],
				correctTitle: "ถูกต้อง",
				wrongTitle: "ข้อนี้มีธงแดง 2 จุด",
				header: "ตำรวจจริงไม่โทรมาสั่งให้โอนเงิน",
				explanation: "วางสาย แล้วโทรสายด่วน 1441",
				redFlags: [link("Entry", "rfCallPolice"), link("Entry", "rfCallNumber")],
			}),
			entry("question", "qSms", {
				prompt: "SMS แจ้งพัสดุเสียหายพร้อมลิงก์ คุณจะทำอย่างไร",
				kpiCategory: "PROTECTIVE_ACTIONS",
				scenario: {
					kind: "sms",
					sender: "SHIPPING",
					body: "พัสดุของท่านเสียหาย bit.ly/49dvdnhm",
					evidence: [{ start: 20, end: 35, flag: 1 }],
				},
				answers: [link("Entry", "aSmsIgnore"), link("Entry", "aSmsClick")],
				explanation: "อย่ากดลิงก์ที่ไม่ได้ขอ",
				redFlags: [link("Entry", "rfSms")],
			}),
			// No scenario and no images: dropped by validation.
			entry("question", "qBroken", {
				order: 4,
				prompt: "ยังเขียนไม่เสร็จ",
				answers: [link("Entry", "aSmsIgnore"), link("Entry", "aSmsClick")],
			}),
			entry("answer", "aPinCancel", { text: "ไม่กรอกรหัส", isCorrect: true }),
			entry("answer", "aPinConfirm", { text: "ยืนยัน", isCorrect: false }),
			entry("answer", "aCallPay", { text: "โอนเงินไปตรวจสอบ", isCorrect: false }),
			entry("answer", "aCallHangUp", { text: "วางสายแล้วโทรกลับเบอร์ทางการ", isCorrect: true }),
			entry("answer", "aSmsIgnore", { text: "ไม่กดลิงก์", isCorrect: true }),
			entry("answer", "aSmsClick", { text: "กดลิงก์", isCorrect: false }),
			entry("redFlag", "rfPin", { label: "ห้ามกรอกรหัสที่คุณใช้จริง", detail: "ธนาคารไม่ขอรหัสผ่านลิงก์" }),
			entry("redFlag", "rfCallNumber", { number: 1, label: "เบอร์แปลกจากต่างประเทศ", x: 50, y: 18 }),
			entry("redFlag", "rfCallPolice", { number: 2, label: "ตำรวจจริงไม่โทรแจ้งข้อกล่าวหา" }),
			entry("redFlag", "rfSms", { label: "มีลิงก์แนบมา" }),
		],
		Asset: [
			asset("imgNormal", "normal.svg", "สายเรียกเข้า"),
			asset("imgResult", "result.svg", "สายเรียกเข้า พร้อมธงแดง"),
		],
	},
};

export const CONTENTFUL_QUIZ_LIST_RESPONSE = {
	sys: { type: "Array" },
	total: 2,
	skip: 0,
	limit: 100,
	items: [
		{
			sys: { id: "quizEntry", revision: 7 },
			fields: {
				slug: "scam-awareness",
				title: "แบบทดสอบ 10 สถานการณ์จำลอง",
				description: "ดูสถานการณ์จำลอง แล้วหาธงแดง",
				questions: [link("Entry", "qPin"), link("Entry", "qCall")],
			},
		},
		{ sys: { id: "noSlug", revision: 1 }, fields: { title: "ไม่มี slug" } },
	],
};
