export const verifyEmailTemplate = (
  content: string,
  subject: string,
  link: string,
  disclaimer: string,
) => {
  return ` <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="format-detection" content="telephone=no" />
        <title>Template Meena</title>
        <style type="text/css">
            /* -------------------------------------
            RESET STYLE
            ------------------------------------- */
            body,
            #bodyTable,
            #bodyCell,
            #bodyCell {
                height: 100% !important;
                margin: 0;
                padding: 0;
                width: 100% !important;
                font-family: sans-serif;
            }

            table {
                border-collapse: collapse;
            }

            table[id=bodyTable] {
                width: 100% !important;
                margin: auto;
                max-width: 600px !important;
                color: #4A5056;
                font-weight: normal;
            }

            /* -------------------------------------
            COMPATIBILITY
            ------------------------------------- */
            table,
            td {
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
            }

            img {
                -ms-interpolation-mode: bicubic;
                outline: none;
                text-decoration: none;
            }

            body,
            table,
            td,
            p,
            a,
            li,
            blockquote {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
                font-weight: normal !important;
            }

            /* -------------------------------------
            STRUCTURE
            ------------------------------------- */
            body,
            #bodyTable {
                background-color: #fff;
            }

            #emailHeader {
                background-color: #fff;
            }

            #emailTitle {
                background: #222529;
                border-radius: 6px 6px 0px 0px;
            }

            #emailBody {
                background-color: #F7FAFC;
                border-radius: 0px 0px 6px 6px;
                border: 1px solid #E2E8F0;
            }

            #emailFooter {
                background-color: #fff;
            }

            /* -------------------------------------
            LOGO
            ------------------------------------- */
            .logo {
                width: 100%;
                text-align: center;
                margin-top: 24px;
                margin-bottom: 24px;
            }

            /* -------------------------------------
            TYPOGRAPHY
            ------------------------------------- */
            .top-text,
            #emailFooter p {
                font-family: Arial;
                font-style: normal;
                font-size: 11px;
                line-height: 16px;
                text-align: center;
                color: #4A5056;
            }

            .email-title-text {
                text-align: left;
                width: 100%;
                font-family: Arial;
                font-style: normal;
                font-weight: bold;
                font-size: 19px;
                line-height: 22px;
                color: #fff;
            }

            #emailBody p {
                font-family: Arial;
                font-style: normal;
                font-weight: normal;
                font-size: 14px;
                line-height: 24px;
                color: #4A5568;
                margin-bottom: 15px;
            }

            #emailBody .code {
                font-family: Arial;
                font-style: normal;
                font-weight: bold;
                font-size: 26px;
                line-height: 24px;
                color: #0D52A1;
                margin-top: -8px;
                display: block;
            }

            #emailBody .help-text {
                font-family: Arial;
                font-style: normal;
                font-weight: normal;
                font-size: 11px;
                line-height: 16px;
                display: block;
                text-align: center;
                color: #4A5056;
            }

            #emailBody .center-text {
                text-align: center;
                width: 100%;
                font-family: Arial;
                font-style: normal;
                font-weight: normal;
                font-size: 12px;
                line-height: 20px;
                text-align: center;
                color: #6E757C;
            }

            #emailBody ul {
                list-style: none;
                padding-left: 0;
            }

            #emailBody ul li {
                margin-bottom: 16px;
                position: relative;
                padding-left: 24px;
                font-size: 15px;
                line-height: 24px;
                color: #4a5568;
                font-weight: normal;
            }

            #emailBody ul li:before {
                content: "";
                position: absolute;
                width: 4px;
                height: 4px;
                top: 10px;
                left: 4px;
                border-radius: 4px;
                background: #0054A8;
                z-index: 1;
            }

            #emailBody ul li:after {
                content: "";
                position: absolute;
                top: 5.5px;
                left: 0;
                width: 12px;
                height: 12px;
                border-radius: 12px;
                background-color: #d8ecd0;
            }

            #emailBody a {
                font-family: Arial;
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 16px;
                color: #0091EA;
                text-decoration: none;
            }

            #emailBody a:hover {
                transition: 0.4s;
                color: #0091EA;
            }

            #emailBody .help-link {
                font-family: Arial;
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 16px;
                color: #0091EA;
                text-decoration: none;
                font-size: 11px;
                line-height: 16px;
                display: block;
                text-align: center;
            }

            #emailBody .help-link:hover {
                transition: 0.4s;
                color: #0D52A1;
            }

            #emailHeader a,
            #emailFooter a {
                font-family: Arial;
                font-style: normal;
                font-weight: 500;
                font-size: 11px;
                color: #0091EA;
                text-decoration: none;
            }

            #emailHeader a:hover,
            #emailFooter a:hover {
                transition: 0.4s;
                color: #0D52A1;
            }

            /* -------------------------------------
            BUTTONS
            ------------------------------------- */
            .btn {
                border-radius: 6px;
                background-color: #6B21A8;
                text-align: center;
                border: none;
                cursor: pointer;
            }

            .btn:hover {
                transition: 0.4s;
                background-color: #6B21A8;
            }

            .btn-text {
                color: #ffffff !important;
                font-family: Arial !important;
                font-weight: bold !important;
                font-size: 14px !important;
            }

            .btn-2,
            a.btn-2 {
                height: 42px;
                width: 217px;
                border-radius: 6px;
                background-color: #6B21A8;
                display: block;
                margin: 24px auto;
                color: #ffffff !important;
                font-family: Arial !important;
                font-size: 14px !important;
                font-weight: bold !important;
                cursor: pointer;
                line-height: 42px !important;
                padding: 0 24px;
                text-align: center !important;
                border: none;
                cursor: pointer;
            }

            .btn-2:hover,
            a.btn-2:hover {
                transition: 0.4s;
                background-color: #6B21A8;
            }

            /* -------------------------------------
            MOBILE
            ------------------------------------- */
            @media only screen and (max-width: 480px) {

                body {
                    width: 100% !important;
                    min-width: 100% !important;
                }

                table[id="emailHeader"],
                table[id="emailBody"],
                table[id="emailFooter"],
                table[id="emailTitle"],
                table[class="flexibleContainer"] {
                    width: 100% !important;
                }

                td[class="flexibleContainerBox"],
                td[class="flexibleContainerBox"] table {
                    display: block;
                    width: 100%;
                    text-align: left;
                }
            }
        </style>
    </head>

    <body bgcolor="#fff" leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">
        <center style="background-color: #fff;">
            <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable"
                style="table-layout: fixed; max-width:100% !important; width: 100% !important; min-width: 100% !important;">
                <tr>
                    <td align="center" valign="top" id="bodyCell">


                        <!-- ***************************  HEADER = TOP-TEXT + LOGO *************************** -->
                        <table bgcolor="#fff" border="0" cellpadding="0" cellspacing="0" width="600" id="emailHeader">
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" valign="top">
                                                <table border="0" cellpadding="10" cellspacing="0" width="600"
                                                    class="flexibleContainer">
                                                    <tr>
                                                        <td valign="top" width="600">
                                                            <table align="left" border="0" cellpadding="0" cellspacing="0"
                                                                width="100%">
                                                                <tr>
                                                                    <td valign="middle" class="flexibleContainerBox">
                                                                        <table border="0" cellpadding="0" cellspacing="0"
                                                                            width="100%"
                                                                            style="max-width:100%; margin-top: 24px;">
                                                                            <tr>
                                                                                <td align="left">
                                                                                    <div class="logo">
                                                                                        <img style="max-width: 300px;"
                                                                                            src="https://vibz.s3.eu-central-1.amazonaws.com/logo/bPower.jpeg" />
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <!-- *************************** END HEADER = TOP-TEXT + LOGO *************************** -->





                        <!-- *************************** EMAIL TITLE *************************** -->
                        <table bgcolor="#fff" border="0" cellpadding="0" cellspacing="0" width="600" id="emailTitle">
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" valign="top">
                                                <table border="0" cellpadding="32" cellspacing="0" width="600"
                                                    class="flexibleContainer">
                                                    <tr>
                                                        <td valign="top" width="600">
                                                            <table align="left" border="0" cellpadding="0" cellspacing="0"
                                                                width="100%">
                                                                <tr>
                                                                    <td valign="middle" class="flexibleContainerBox">
                                                                        <table border="0" cellpadding="0" cellspacing="0"
                                                                            width="100%" style="max-width:100%;">
                                                                            <tr>
                                                                                <td align="left">
                                                                                    <div class="email-title-text">
                                                                                        ${subject}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <!-- ***************************  END EMAIL TITLE *************************** -->





                        <!-- *************************** EMAIL CONTENT *************************** -->
                        <table bgcolor="#F7FAFC" border="0" cellpadding="0" cellspacing="0" width="598" id="emailBody">
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" valign="top">
                                                <table border="0" cellpadding="0" cellspacing="0" width="598"
                                                    class="flexibleContainer">
                                                    <tr>
                                                        <td align="center" valign="top" width="598">
                                                            <table border="0" cellpadding="32" cellspacing="0" width="100%">
                                                                <tr>
                                                                    <td align="center" valign="top">
                                                                        <table border="0" cellpadding="0" cellspacing="0"
                                                                            width="100%">
                                                                            <tr>
                                                                                <td valign="top">
                                                                                    <p>
                                                                                        ${content}
                                                                                    </p>
                                                                                    <a href="${link}"
                                                                                        class="btn-2">Activez votre compte</a>
                                                                                    <div class="center-text">
                                                                                        ${disclaimer}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <!-- *************************** END EMAIL CONTENT *************************** -->
                    </td>
                </tr>
            </table>
        </center>
    </body>
</html> `;
};
