/**
 * Fake example headers for the "Load example" button. Only reserved names
 * (example.com / example.net / example.org, RFC 2606) and documentation IPs
 * (192.0.2.0/24, 198.51.100.0/24, RFC 5737) are used.
 */
export const SAMPLE_HEADERS = `Delivered-To: alice@example.com
Received: by 2001:db8:100::1 with SMTP id z12csp4410123abc;
        Tue, 29 Sep 2026 03:42:18 -0700 (PDT)
X-Received: by 2001:db8:100::2 with SMTP id a1mr99887766;
        Tue, 29 Sep 2026 03:42:18 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1790678538; cv=none; d=example.com; s=arc-2026;
        b=ZmFrZXNpZ25hdHVyZWZvcnRoZWV4YW1wbGVvbmx5
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=arc-2026;
        h=subject:date:reply-to:from:to:message-id; bh=ZmFrZWJvZHloYXNo; b=ZmFrZQ==
ARC-Authentication-Results: i=1; mx.example.com;
       spf=softfail (example.com: domain of transitioning bounce@mailer.example.org does not designate 198.51.100.77 as permitted sender) smtp.mailfrom=bounce@mailer.example.org;
       dkim=pass header.i=@mailer.example.org header.s=s1 header.b=ZmFrZQ;
       dmarc=fail (p=QUARANTINE sp=QUARANTINE dis=QUARANTINE) header.from=example.net
Return-Path: <bounce@mailer.example.org>
Received: from mailer.example.org (mailer.example.org. [198.51.100.77])
        by mx.example.com with ESMTPS id k9si1234567abc.101.2026.09.29.03.42.17
        for <alice@example.com>
        (version=TLS1_3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256);
        Tue, 29 Sep 2026 03:42:17 -0700 (PDT)
Received-SPF: softfail (example.com: domain of transitioning bounce@mailer.example.org does not designate 198.51.100.77 as permitted sender) client-ip=198.51.100.77;
Authentication-Results: mx.example.com;
       spf=softfail (example.com: domain of transitioning bounce@mailer.example.org does not designate 198.51.100.77 as permitted sender) smtp.mailfrom=bounce@mailer.example.org;
       dkim=pass header.i=@mailer.example.org header.s=s1 header.b=ZmFrZQ;
       dmarc=fail (p=QUARANTINE sp=QUARANTINE dis=QUARANTINE) header.from=example.net
Received: from [192.168.1.23] (unknown [192.0.2.45])
        by mailer.example.org (Postfix) with ESMTPSA id 4Fq2Lk0m3Zz9sT
        for <alice@example.com>; Tue, 29 Sep 2026 12:44:02 +0200 (CEST)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=mailer.example.org; s=s1;
        t=1790678522; h=from:reply-to:to:subject:date:message-id:mime-version;
        bh=ZmFrZWJvZHloYXNoZm9ydGhlZXhhbXBsZQ==;
        b=ZmFrZXNpZ25hdHVyZWZvcnRoZWV4YW1wbGVvbmx5ZmFrZXNpZ25hdHVyZQ==
From: "support@example.com" <no-reply@example.net>
Reply-To: Account Team <recovery@example.org>
To: alice@example.com
Subject: =?UTF-8?B?QWN0aW9uIHJlcXVpcmVkOiB2ZXJpZnkgeW91ciBhY2NvdW50?=
 =?UTF-8?Q?_=E2=80=93_example?=
Date: Tue, 29 Sep 2026 10:41:55 +0000
Message-ID: <20260929104155.4711@web01.example.org>
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"
X-Mailer: PHPMailer 6.9.1 (https://github.com/PHPMailer/PHPMailer)
X-Originating-IP: [192.0.2.45]
X-Priority: 1 (Highest)
X-Campaign-ID: example-0042
`;
