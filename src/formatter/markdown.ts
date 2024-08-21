import {LintMessageSeverity, LintResult, LintMessage} from "../linter/LinterContext.js";

export class Markdown {
	format(lintResults: LintResult[], showDetails: boolean): string {
		let output = "# UI5 Linter Report\n\n";
		let totalErrorCount = 0;
		let totalWarningCount = 0;
		let totalFatalErrorCount = 0;
		lintResults.sort((a, b) => a.filePath.localeCompare(b.filePath));
		// Process each lint result
		lintResults.forEach(({filePath, messages, errorCount, warningCount, fatalErrorCount}) => {
			if (!errorCount && !warningCount) {
				// Skip files without errors or warnings
				return;
			}
			// Accumulate totals
			totalErrorCount += errorCount;
			totalWarningCount += warningCount;
			totalFatalErrorCount += fatalErrorCount;

			// Add the file path as a section header
			output += `#### ${(process.cwd(), filePath)}\n\n`;
			if (showDetails === true) {
				output += `| Severity | Line | Message | Details |\n`;
				output += `|----------|------|---------|---------|\n`;
			} else {
				output += `| Severity | Line | Message |\n`;
				output += `|----------|------|---------|\n`;
			}
			// Group messages by rule for easier reading
			const rules = new Map<string, LintMessage[]>();
			messages.forEach((msg) => {
				const entry = rules.get(msg.ruleId);
				if (entry) {
					entry.push(msg);
				} else {
					rules.set(msg.ruleId, [msg]);
				}
			});

			// Sort messages by severity  (sorting order: fatal-errors, errors, warnings)
			messages.sort((a, b) => {
				// Handle fatal errors first to push them to the bottom
				if (a.fatal !== b.fatal) {
					return a.fatal ? -1 : 1; // Fatal errors go to the top
				}
				// First, compare by severity
				if (a.severity !== b.severity) {
					return b.severity - a.severity;
				}
				// If severity is the same, compare by line number (handling nulls)
				if ((a.line ?? 0) !== (b.line ?? 0)) {
					return (a.line ?? 0) - (b.line ?? 0);
				}
				// If both severity and line number are the same, compare by column number (handling nulls)
				return (a.column ?? 0) - (b.column ?? 0);
			});

			// Format each message
			messages.forEach((msg) => {
				const severity = this.formatSeverity(msg.severity, msg.fatal);
				const location = this.formatLocation(msg.line, msg.column);
				const details = this.formatMessageDetails(msg, showDetails);

				output += `|${severity} | \`${location}\` |${msg.message}|${details}|\n`;
			});

			output += "\n";
		});

		//	Summary section
		output += "## Summary\n\n";
		output += `  - Total problems: ${totalErrorCount + totalWarningCount}\n `;

		// Include fatal errors count if any
		output += ` - Warnings: ${totalWarningCount}\n `;
		output += ` - Errors: ${totalErrorCount}\n`;
		if (totalFatalErrorCount) {
			output += `  - Fatal errors:${totalFatalErrorCount}\n`;
		}

		// Suggest using the details option if not all details are shown
		if (!showDetails && (totalErrorCount + totalWarningCount + totalFatalErrorCount) > 0) {
			output += "\n**Note:** Use `ui5lint --details` to show more information about the findings.\n";
		}
		return output;
	}

	// Formats the severity of the lint message using appropriate emoji
	private formatSeverity(severity: LintMessageSeverity, fatal: LintMessage["fatal"]): string {
		if (fatal === true) {
			return " Fatal Error";
		} else if (severity === LintMessageSeverity.Warning) {
			return " Warning";
		} else if (severity === LintMessageSeverity.Error) {
			return " Error";
		} else {
			throw new Error(`Unknown severity: ${LintMessageSeverity[severity]}`);
		}
	}

	// Formats the location of the lint message (line and column numbers)
	private formatLocation(line?: number, column?: number): string {
		// Default to 0 if line or column are not provided
		return `[${line ?? 0}:${column ?? 0}]`;
	}

	// Formats additional message details if `showDetails` is true
	private formatMessageDetails(msg: LintMessage, showDetails: boolean): string {
		if (!showDetails || !msg.messageDetails) {
			return "";
		}
		// Replace multiple spaces or newlines with a single space for clean output
		return `${msg.messageDetails.replace(/\s\s+|\n/g, " ")}`;
	}
}
