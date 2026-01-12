"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function HelpImportExcelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{/* Custom overlay for blur and dark effect */}
			<DialogPrimitive.Overlay
				style={{
					position: 'fixed',
					inset: 0,
					zIndex: 50,
					background: 'rgba(10,10,20,0.75)',
					backdropFilter: 'blur(4px)',
				}}
			/>
			<DialogContent
				className="w-fit max-w-[98vw] p-0"
				style={{
					borderRadius: 0,
					boxShadow: '0 8px 40px 8px rgba(0,0,0,0.45)',
					background: 'var(--background, #18181b)',
					zIndex: 60,
					padding: 0,
				}}
			>
				<DialogHeader className="px-8 pt-8">
					<DialogTitle className="text-2xl font-bold text-primary">Ketentuan Import Data Excel</DialogTitle>
				</DialogHeader>
				<ScrollArea className="max-h-[65vh] px-8 pb-8 pt-2">
					<section className="mb-6">
						<h3 className="text-base font-semibold mb-1 text-muted-foreground">1. Format File</h3>
						<ul className="list-disc pl-5 space-y-1 text-sm">
							<li>Format file: <span className="font-semibold text-primary">.xlsx</span>, <span className="font-semibold text-primary">.xls</span> (Excel Workbook), atau <span className="font-semibold text-primary">.csv</span></li>
							<li>Hanya sheet pertama yang akan diproses</li>
						</ul>
						<div className="mt-2">{/* ...existing code... */}</div>
					</section>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
