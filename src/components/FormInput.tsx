interface FormInputProps {
	id: string;
	label: string;
	type?: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
}

export default function FormInput({
	id,
	label,
	type = "text",
	placeholder,
	value,
	onChange,
	required,
}: FormInputProps) {
	return (
		<div>
			<label
				htmlFor={id}
				className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
			>
				{label}
			</label>
			<input
				id={id}
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
				className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>
		</div>
	);
}
