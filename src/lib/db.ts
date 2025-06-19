let neonSql: any = null;

async function initNeon() {
	if (!neonSql) {
		try {
			const { neon } = await import('@neondatabase/serverless');
			const DATABASE_URL = process.env.DATABASE_URL;
			if (!DATABASE_URL) {
				throw new Error('DATABASE_URL environment variable is not set');
			}
			neonSql = neon(DATABASE_URL);
		} catch (error) {
			throw new Error('Failed to initialize Neon connection: ' + error);
		}
	}
	return neonSql;
}

export const db = {
	async query(text: string, params: any[] = []) {
		try {
			const sql = await initNeon();
			
			// For Neon serverless, we need to use a completely different approach
			// Build the complete query string with values substituted
			let query = text;
			
			for (let i = 0; i < params.length; i++) {
				const param = params[i];
				const placeholder = `$${i + 1}`;
				let value: string;
				
				if (param === null || param === undefined) {
					value = 'NULL';
				} else if (typeof param === 'string') {
					// Escape single quotes properly
					value = `'${param.replace(/'/g, "''")}'`;
				} else if (typeof param === 'boolean') {
					value = param ? 'TRUE' : 'FALSE';
				} else if (typeof param === 'object') {
					value = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
				} else {
					value = String(param);
				}
				
				// Replace all instances of this placeholder
				query = query.replace(new RegExp('\\' + placeholder + '\\b', 'g'), value);
			}
			
			console.log('Executing Neon query:', query);
			
			// Execute using Neon's tagged template
			const result = await sql`SELECT * FROM (${query}) AS subquery`;
			return { rows: Array.isArray(result) ? result : [result] };
		} catch (error) {
			console.error('Database query error:', error);
			
			// If the above approach fails, try direct execution
			try {
				const sql = await initNeon();
				let query = text;
				
				for (let i = 0; i < params.length; i++) {
					const param = params[i];
					const placeholder = `$${i + 1}`;
					let value: string;
					
					if (param === null || param === undefined) {
						value = 'NULL';
					} else if (typeof param === 'string') {
						value = `'${param.replace(/'/g, "''")}'`;
					} else if (typeof param === 'boolean') {
						value = param ? 'TRUE' : 'FALSE';
					} else if (typeof param === 'object') {
						value = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
					} else {
						value = String(param);
					}
					
					query = query.replace(new RegExp('\\' + placeholder + '\\b', 'g'), value);
				}
				
				console.log('Fallback query:', query);
				const result = await sql([query]);
				return { rows: Array.isArray(result) ? result : [result] };
			} catch (fallbackError) {
				console.error('Fallback query also failed:', fallbackError);
				throw error; // Throw the original error
			}
		}
	}
};