package com.vishal.service;

import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

    public String buildHtmlEmail(String userName, String title, String detailsText, String timestamp) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <style>\n" +
                "    body {\n" +
                "      font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\n" +
                "      background-color: #0b0b0c;\n" +
                "      color: #e2e8f0;\n" +
                "      margin: 0;\n" +
                "      padding: 0;\n" +
                "    }\n" +
                "    .wrapper {\n" +
                "      width: 100%;\n" +
                "      background-color: #0b0b0c;\n" +
                "      padding: 40px 0;\n" +
                "    }\n" +
                "    .container {\n" +
                "      max-width: 600px;\n" +
                "      margin: 0 auto;\n" +
                "      background-color: #101012;\n" +
                "      border: 1px solid #202023;\n" +
                "      border-radius: 16px;\n" +
                "      overflow: hidden;\n" +
                "      box-shadow: 0 10px 30px rgba(0,0,0,0.5);\n" +
                "    }\n" +
                "    .header {\n" +
                "      padding: 30px;\n" +
                "      background: linear-gradient(135deg, #122c22, #101012);\n" +
                "      border-bottom: 1px solid #1a3c2f;\n" +
                "      text-align: center;\n" +
                "    }\n" +
                "    .logo {\n" +
                "      font-size: 24px;\n" +
                "      font-weight: 800;\n" +
                "      color: #00e699;\n" +
                "      letter-spacing: 0.5px;\n" +
                "    }\n" +
                "    .content {\n" +
                "      padding: 30px;\n" +
                "    }\n" +
                "    h2 {\n" +
                "      font-size: 20px;\n" +
                "      font-weight: 700;\n" +
                "      margin-top: 0;\n" +
                "      color: #ffffff;\n" +
                "    }\n" +
                "    p {\n" +
                "      font-size: 14px;\n" +
                "      line-height: 1.6;\n" +
                "      color: #94a3b8;\n" +
                "    }\n" +
                "    .details-box {\n" +
                "      background-color: #0b0b0c;\n" +
                "      border: 1px solid #1a1a1c;\n" +
                "      border-radius: 12px;\n" +
                "      padding: 20px;\n" +
                "      margin: 25px 0;\n" +
                "    }\n" +
                "    .details-row {\n" +
                "      margin-bottom: 10px;\n" +
                "      font-size: 13px;\n" +
                "    }\n" +
                "    .details-row:last-child {\n" +
                "      margin-bottom: 0;\n" +
                "    }\n" +
                "    .details-label {\n" +
                "      color: #64748b;\n" +
                "      font-weight: 600;\n" +
                "      display: inline-block;\n" +
                "      width: 120px;\n" +
                "    }\n" +
                "    .details-value {\n" +
                "      color: #e2e8f0;\n" +
                "    }\n" +
                "    .footer {\n" +
                "      padding: 30px;\n" +
                "      background-color: #08080a;\n" +
                "      border-top: 1px solid #141416;\n" +
                "      font-size: 11px;\n" +
                "      color: #475569;\n" +
                "      text-align: center;\n" +
                "    }\n" +
                "    .footer a {\n" +
                "      color: #00e699;\n" +
                "      text-decoration: none;\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"wrapper\">\n" +
                "    <div class=\"container\">\n" +
                "      <div class=\"header\">\n" +
                "        <div class=\"logo\">📊 CryptoVault</div>\n" +
                "      </div>\n" +
                "      <div class=\"content\">\n" +
                "        <h2>Hello, " + userName + "</h2>\n" +
                "        <p>This is an automated notification from your CryptoVault account.</p>\n" +
                "        <div style=\"font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 10px;\">" + title + "</div>\n" +
                "        <p>" + detailsText + "</p>\n" +
                "        <div class=\"details-box\">\n" +
                "          <div class=\"details-row\">\n" +
                "            <span class=\"details-label\">Timestamp:</span>\n" +
                "            <span class=\"details-value\">" + timestamp + "</span>\n" +
                "          </div>\n" +
                "          <div class=\"details-row\">\n" +
                "            <span class=\"details-label\">Status:</span>\n" +
                "            <span class=\"details-value\" style=\"color: #00e699; font-weight: bold;\">PROCESSED</span>\n" +
                "          </div>\n" +
                "        </div>\n" +
                "      </div>\n" +
                "      <div class=\"footer\">\n" +
                "        <p>If you did not initiate this action, please contact our support team immediately.</p>\n" +
                "        <p>Need help? Contact us at <a href=\"mailto:support@cryptovault.com\">support@cryptovault.com</a></p>\n" +
                "        <p style=\"margin-top: 15px; font-size: 10px;\">© 2026 CryptoVault. All rights reserved. Your security is our highest priority.</p>\n" +
                "      </div>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
