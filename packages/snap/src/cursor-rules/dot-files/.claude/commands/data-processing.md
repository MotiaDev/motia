# Data Processing with Ruby

Use Ruby for data manipulation, reporting, and background processing in Motia workflows.

## CSV Processing Pipeline

### API Upload (TypeScript)
```typescript
// steps/api/data/upload-csv.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UploadCSV',
  method: 'POST',
  path: '/data/csv/upload',
  middleware: [authMiddleware, multer().single('file')],
  emits: ['csv.process.requested']
}

export const handler = async (req, { emit, state }) => {
  const file = req.file
  const jobId = crypto.randomUUID()
  
  await state.set('csv_jobs', jobId, {
    filename: file.originalname,
    size: file.size,
    content: file.buffer,
    status: 'pending'
  })
  
  await emit({
    topic: 'csv.process.requested',
    data: { jobId, options: req.body }
  })
  
  return { status: 202, body: { jobId } }
}
```

### Ruby CSV Processing
```ruby
# steps/data/process_csv.step.rb
require 'csv'
require 'json'
require 'date'

def config
  {
    type: 'event',
    name: 'ProcessCSV',
    subscribes: ['csv.process.requested'],
    emits: ['csv.process.completed', 'report.generate'],
    input: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        options: { type: 'object' }
      }
    }
  }
end

def handler(input, context)
  job_id = input['jobId']
  options = input['options'] || {}
  
  begin
    # Get CSV data
    job_data = context.state.get('csv_jobs', job_id)
    csv_content = job_data['content']
    
    # Parse CSV
    rows = CSV.parse(csv_content, headers: true)
    context.logger.info("Processing CSV with #{rows.length} rows")
    
    # Process based on options
    results = case options['operation']
    when 'transform'
      transform_data(rows, options)
    when 'aggregate'
      aggregate_data(rows, options)
    when 'validate'
      validate_data(rows, options)
    when 'enrich'
      enrich_data(rows, options, context)
    else
      { processed_rows: rows.map(&:to_h) }
    end
    
    # Generate summary statistics
    stats = generate_statistics(rows)
    
    # Store results
    context.state.set('csv_results', job_id, {
      'jobId' => job_id,
      'results' => results,
      'statistics' => stats,
      'processedAt' => DateTime.now.iso8601,
      'rowCount' => rows.length
    })
    
    # Update job status
    job_data['status'] = 'completed'
    context.state.set('csv_jobs', job_id, job_data)
    
    # Emit completion
    context.emit(
      topic: 'csv.process.completed',
      data: {
        jobId: job_id,
        rowCount: rows.length,
        hasErrors: results[:errors]&.any?
      }
    )
    
    # Trigger report generation if requested
    if options['generateReport']
      context.emit(
        topic: 'report.generate',
        data: {
          jobId: job_id,
          type: 'csv_analysis',
          format: options['reportFormat'] || 'pdf'
        }
      )
    end
    
  rescue => e
    context.logger.error("CSV processing failed: #{e.message}")
    job_data['status'] = 'failed'
    job_data['error'] = e.message
    context.state.set('csv_jobs', job_id, job_data)
    raise
  end
end

def transform_data(rows, options)
  transformations = options['transformations'] || []
  errors = []
  
  transformed_rows = rows.map.with_index do |row, index|
    begin
      transformed = row.to_h
      
      transformations.each do |transform|
        case transform['type']
        when 'rename_column'
          value = transformed.delete(transform['from'])
          transformed[transform['to']] = value
          
        when 'calculate'
          # Simple calculations
          case transform['operation']
          when 'multiply'
            transformed[transform['target']] = 
              transformed[transform['source']].to_f * transform['factor']
          when 'concatenate'
            transformed[transform['target']] = 
              transform['fields'].map { |f| transformed[f] }.join(transform['separator'] || ' ')
          when 'date_format'
            date = Date.parse(transformed[transform['source']])
            transformed[transform['target']] = date.strftime(transform['format'])
          end
          
        when 'filter'
          # Mark for filtering
          if !evaluate_condition(transformed, transform['condition'])
            transformed['_filtered'] = true
          end
        end
      end
      
      transformed
    rescue => e
      errors << { row: index + 1, error: e.message }
      row.to_h
    end
  end
  
  # Remove filtered rows
  transformed_rows.reject! { |r| r['_filtered'] }
  
  {
    transformed_rows: transformed_rows,
    errors: errors,
    original_count: rows.length,
    final_count: transformed_rows.length
  }
end

def aggregate_data(rows, options)
  group_by = options['groupBy'] || []
  aggregations = options['aggregations'] || []
  
  # Group data
  grouped = rows.group_by do |row|
    group_by.map { |field| row[field] }.join('||')
  end
  
  # Perform aggregations
  results = grouped.map do |key, group_rows|
    values = key.split('||')
    result = Hash[group_by.zip(values)]
    
    aggregations.each do |agg|
      field = agg['field']
      values = group_rows.map { |r| r[field]&.to_f }.compact
      
      result[agg['alias'] || "#{agg['function']}_#{field}"] = case agg['function']
      when 'sum'
        values.sum
      when 'avg', 'mean'
        values.sum / values.length.to_f
      when 'min'
        values.min
      when 'max'
        values.max
      when 'count'
        values.length
      when 'distinct_count'
        values.uniq.length
      when 'std_dev'
        mean = values.sum / values.length.to_f
        variance = values.sum { |v| (v - mean) ** 2 } / values.length
        Math.sqrt(variance)
      end
    end
    
    result
  end
  
  {
    aggregated_data: results,
    group_count: grouped.length,
    total_rows: rows.length
  }
end

def validate_data(rows, options)
  rules = options['rules'] || []
  errors = []
  warnings = []
  valid_rows = []
  
  rows.each_with_index do |row, index|
    row_errors = []
    row_warnings = []
    
    rules.each do |rule|
      field = rule['field']
      value = row[field]
      
      case rule['type']
      when 'required'
        if value.nil? || value.to_s.strip.empty?
          row_errors << "#{field} is required"
        end
        
      when 'pattern'
        if value && !value.match?(Regexp.new(rule['pattern']))
          row_errors << "#{field} doesn't match required pattern"
        end
        
      when 'range'
        num_value = value.to_f
        if rule['min'] && num_value < rule['min']
          row_errors << "#{field} is below minimum value (#{rule['min']})"
        end
        if rule['max'] && num_value > rule['max']
          row_errors << "#{field} exceeds maximum value (#{rule['max']})"
        end
        
      when 'unique'
        # Check uniqueness within the dataset
        duplicates = rows.select { |r| r[field] == value }
        if duplicates.length > 1
          row_warnings << "#{field} value '#{value}' is not unique"
        end
        
      when 'email'
        if value && !value.match?(/\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i)
          row_errors << "#{field} is not a valid email"
        end
        
      when 'date'
        begin
          Date.parse(value) if value
        rescue
          row_errors << "#{field} is not a valid date"
        end
      end
    end
    
    if row_errors.empty?
      valid_rows << row.to_h
    else
      errors << {
        row: index + 1,
        data: row.to_h,
        errors: row_errors
      }
    end
    
    if row_warnings.any?
      warnings << {
        row: index + 1,
        warnings: row_warnings
      }
    end
  end
  
  {
    valid_rows: valid_rows,
    invalid_rows: errors,
    warnings: warnings,
    validation_summary: {
      total_rows: rows.length,
      valid_count: valid_rows.length,
      invalid_count: errors.length,
      warning_count: warnings.length
    }
  }
end

def enrich_data(rows, options, context)
  enrichments = options['enrichments'] || []
  enriched_rows = []
  
  rows.each do |row|
    enriched = row.to_h
    
    enrichments.each do |enrichment|
      case enrichment['type']
      when 'lookup'
        # Lookup from state/database
        lookup_key = row[enrichment['keyField']]
        lookup_data = context.state.get(enrichment['lookupTable'], lookup_key)
        
        if lookup_data
          enrichment['fields'].each do |field|
            enriched["#{enrichment['prefix']}_#{field}"] = lookup_data[field]
          end
        end
        
      when 'geocode'
        # Geocode address
        address = enrichment['addressFields'].map { |f| row[f] }.join(', ')
        coords = geocode_address(address)
        enriched['latitude'] = coords[:lat]
        enriched['longitude'] = coords[:lng]
        
      when 'calculate_age'
        # Calculate age from date
        if row[enrichment['dateField']]
          birth_date = Date.parse(row[enrichment['dateField']])
          age = ((Date.today - birth_date) / 365.25).floor
          enriched[enrichment['targetField']] = age
        end
      end
    end
    
    enriched_rows << enriched
  end
  
  {
    enriched_rows: enriched_rows,
    enrichment_count: enrichments.length
  }
end

def generate_statistics(rows)
  return {} if rows.empty?
  
  stats = {
    row_count: rows.length,
    column_count: rows.first.headers.length,
    columns: {}
  }
  
  rows.first.headers.each do |column|
    values = rows.map { |r| r[column] }.compact
    
    # Determine column type
    numeric_values = values.map { |v| Float(v) rescue nil }.compact
    
    if numeric_values.length > values.length * 0.8  # 80% numeric
      # Numeric column statistics
      stats[:columns][column] = {
        type: 'numeric',
        count: numeric_values.length,
        null_count: rows.length - values.length,
        min: numeric_values.min,
        max: numeric_values.max,
        mean: numeric_values.sum / numeric_values.length.to_f,
        median: calculate_median(numeric_values),
        std_dev: calculate_std_dev(numeric_values)
      }
    else
      # Text column statistics
      stats[:columns][column] = {
        type: 'text',
        count: values.length,
        null_count: rows.length - values.length,
        unique_count: values.uniq.length,
        most_common: values.tally.max_by { |_, count| count },
        avg_length: values.map(&:to_s).map(&:length).sum / values.length.to_f
      }
    end
  end
  
  stats
end

def calculate_median(values)
  sorted = values.sort
  len = sorted.length
  len.odd? ? sorted[len / 2] : (sorted[len / 2 - 1] + sorted[len / 2]) / 2.0
end

def calculate_std_dev(values)
  mean = values.sum / values.length.to_f
  variance = values.sum { |v| (v - mean) ** 2 } / values.length
  Math.sqrt(variance)
end

def evaluate_condition(row, condition)
  field = condition['field']
  operator = condition['operator']
  value = condition['value']
  row_value = row[field]
  
  case operator
  when 'equals'
    row_value == value
  when 'not_equals'
    row_value != value
  when 'contains'
    row_value.to_s.include?(value.to_s)
  when 'greater_than'
    row_value.to_f > value.to_f
  when 'less_than'
    row_value.to_f < value.to_f
  when 'in'
    value.include?(row_value)
  else
    true
  end
end
```

## Excel Report Generation

```ruby
# steps/reporting/generate_excel_report.step.rb
require 'axlsx'
require 'json'

def config
  {
    type: 'event',
    name: 'GenerateExcelReport',
    subscribes: ['report.generate'],
    emits: ['report.completed', 'email.send'],
    input: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        type: { type: 'string' },
        format: { type: 'string' }
      }
    }
  }
end

def handler(input, context)
  return unless input['format'] == 'xlsx'
  
  job_id = input['jobId']
  report_type = input['type']
  
  begin
    # Get data
    results = context.state.get('csv_results', job_id)
    job_info = context.state.get('csv_jobs', job_id)
    
    # Create Excel workbook
    package = Axlsx::Package.new
    workbook = package.workbook
    
    # Add styles
    styles = create_styles(workbook)
    
    # Summary sheet
    add_summary_sheet(workbook, results, job_info, styles)
    
    # Data sheet
    if results['results']['transformed_rows']
      add_data_sheet(workbook, results['results']['transformed_rows'], 'Transformed Data', styles)
    elsif results['results']['aggregated_data']
      add_data_sheet(workbook, results['results']['aggregated_data'], 'Aggregated Data', styles)
    elsif results['results']['valid_rows']
      add_data_sheet(workbook, results['results']['valid_rows'], 'Valid Data', styles)
    end
    
    # Statistics sheet
    add_statistics_sheet(workbook, results['statistics'], styles) if results['statistics']
    
    # Errors sheet
    add_errors_sheet(workbook, results['results'], styles) if has_errors?(results['results'])
    
    # Charts
    add_charts(workbook, results) if results['results']['aggregated_data']
    
    # Save file
    file_path = "/tmp/report_#{job_id}.xlsx"
    package.serialize(file_path)
    
    # Upload to storage
    report_url = upload_to_storage(file_path, "reports/#{job_id}.xlsx", context)
    
    # Clean up
    File.delete(file_path)
    
    # Update report status
    context.state.set('reports', job_id, {
      'url' => report_url,
      'format' => 'xlsx',
      'generatedAt' => DateTime.now.iso8601,
      'size' => File.size(file_path)
    })
    
    # Emit completion
    context.emit(
      topic: 'report.completed',
      data: {
        jobId: job_id,
        reportUrl: report_url,
        format: 'xlsx'
      }
    )
    
    context.logger.info("Excel report generated: #{job_id}")
    
  rescue => e
    context.logger.error("Excel generation failed: #{e.message}")
    raise
  end
end

def create_styles(workbook)
  {
    title: workbook.styles.add_style(
      sz: 16, 
      b: true, 
      alignment: { horizontal: :center }
    ),
    header: workbook.styles.add_style(
      b: true,
      bg_color: '4472C4',
      fg_color: 'FFFFFF',
      alignment: { horizontal: :center },
      border: { style: :thin, color: '000000' }
    ),
    subheader: workbook.styles.add_style(
      b: true,
      bg_color: 'D9E2F3'
    ),
    number: workbook.styles.add_style(
      num_fmt: '#,##0.00'
    ),
    percent: workbook.styles.add_style(
      num_fmt: '0.00%'
    ),
    date: workbook.styles.add_style(
      num_fmt: 'yyyy-mm-dd'
    ),
    currency: workbook.styles.add_style(
      num_fmt: '$#,##0.00'
    ),
    highlight: workbook.styles.add_style(
      bg_color: 'FFFF00'
    ),
    error: workbook.styles.add_style(
      bg_color: 'FF0000',
      fg_color: 'FFFFFF'
    )
  }
end

def add_summary_sheet(workbook, results, job_info, styles)
  workbook.add_worksheet(name: 'Summary') do |sheet|
    # Title
    sheet.add_row ['Data Processing Report'], style: styles[:title]
    sheet.merge_cells 'A1:D1'
    sheet.add_row []
    
    # Job information
    sheet.add_row ['Job Information'], style: styles[:subheader]
    sheet.add_row ['Job ID:', job_id]
    sheet.add_row ['File Name:', job_info['filename']]
    sheet.add_row ['Processed At:', results['processedAt']]
    sheet.add_row ['Total Rows:', results['rowCount']]
    sheet.add_row []
    
    # Processing summary
    if results['results']['validation_summary']
      summary = results['results']['validation_summary']
      sheet.add_row ['Validation Summary'], style: styles[:subheader]
      sheet.add_row ['Valid Rows:', summary['valid_count']]
      sheet.add_row ['Invalid Rows:', summary['invalid_count']]
      sheet.add_row ['Warnings:', summary['warning_count']]
      sheet.add_row ['Success Rate:', summary['valid_count'].to_f / summary['total_rows']], 
                    style: [nil, styles[:percent]]
    end
    
    # Set column widths
    sheet.column_widths 20, 30, 20, 20
  end
end

def add_data_sheet(workbook, data, sheet_name, styles)
  return if data.empty?
  
  workbook.add_worksheet(name: sheet_name) do |sheet|
    # Headers
    headers = data.first.keys
    sheet.add_row headers, style: styles[:header]
    
    # Data rows
    data.each do |row|
      row_data = headers.map { |h| row[h] }
      row_styles = row_data.map { |v| get_cell_style(v, styles) }
      sheet.add_row row_data, style: row_styles
    end
    
    # Auto-filter
    sheet.auto_filter = "A1:#{column_letter(headers.length)}#{data.length + 1}"
    
    # Freeze panes
    sheet.sheet_view.pane do |pane|
      pane.top_left_cell = 'A2'
      pane.state = :frozen_split
      pane.y_split = 1
    end
    
    # Adjust column widths
    headers.each_with_index do |_, i|
      sheet.column_info[i].width = 15
    end
  end
end

def add_statistics_sheet(workbook, stats, styles)
  workbook.add_worksheet(name: 'Statistics') do |sheet|
    sheet.add_row ['Column Statistics'], style: styles[:title]
    sheet.merge_cells 'A1:H1'
    sheet.add_row []
    
    # Headers
    headers = ['Column', 'Type', 'Count', 'Nulls', 'Min', 'Max', 'Mean', 'Unique']
    sheet.add_row headers, style: styles[:header]
    
    # Statistics for each column
    stats['columns'].each do |column, col_stats|
      if col_stats['type'] == 'numeric'
        sheet.add_row [
          column,
          col_stats['type'],
          col_stats['count'],
          col_stats['null_count'],
          col_stats['min'],
          col_stats['max'],
          col_stats['mean'].round(2),
          'N/A'
        ]
      else
        sheet.add_row [
          column,
          col_stats['type'],
          col_stats['count'],
          col_stats['null_count'],
          'N/A',
          'N/A',
          'N/A',
          col_stats['unique_count']
        ]
      end
    end
  end
end

def add_charts(workbook, results)
  data = results['results']['aggregated_data']
  return if data.empty?
  
  # Find numeric columns for charting
  numeric_columns = data.first.keys.select do |key|
    data.all? { |row| row[key].is_a?(Numeric) }
  end
  
  return if numeric_columns.empty?
  
  workbook.add_worksheet(name: 'Charts') do |sheet|
    sheet.add_row ['Data Visualizations'], style: styles[:title]
    
    # Add chart data
    sheet.add_row ['Category'] + numeric_columns
    data.each do |row|
      sheet.add_row [row.values.first] + numeric_columns.map { |col| row[col] }
    end
    
    # Create bar chart
    sheet.add_chart(Axlsx::Bar3DChart, start_at: 'A10', end_at: 'J25') do |chart|
      chart.title = 'Data Analysis'
      chart.grouping = :standard
      
      numeric_columns.each_with_index do |col, i|
        chart.add_series(
          data: ["B2:B#{data.length + 1}"],
          labels: ["A2:A#{data.length + 1}"],
          title: col
        )
      end
    end
  end
end

def column_letter(index)
  letters = ('A'..'Z').to_a
  result = ''
  
  while index > 0
    index -= 1
    result = letters[index % 26] + result
    index /= 26
  end
  
  result
end

def get_cell_style(value, styles)
  case value
  when Numeric
    value % 1 == 0 ? nil : styles[:number]
  when Date, Time
    styles[:date]
  else
    nil
  end
end
```

## Data Export Pipeline

```ruby
# steps/export/export_data.step.rb
require 'json'
require 'zip'

def config
  {
    type: 'event',
    name: 'ExportData',
    subscribes: ['export.requested'],
    emits: ['export.completed'],
    input: {
      type: 'object',
      properties: {
        exportId: { type: 'string' },
        entityType: { type: 'string' },
        format: { type: 'string' },
        filters: { type: 'object' }
      }
    }
  }
end

def handler(input, context)
  export_id = input['exportId']
  entity_type = input['entityType']
  format = input['format']
  filters = input['filters'] || {}
  
  begin
    # Fetch data based on entity type
    data = fetch_entity_data(entity_type, filters, context)
    context.logger.info("Exporting #{data.length} #{entity_type} records")
    
    # Export based on format
    file_path = case format
    when 'json'
      export_json(data, export_id)
    when 'csv'
      export_csv(data, export_id)
    when 'xml'
      export_xml(data, export_id)
    when 'sql'
      export_sql(data, entity_type, export_id)
    when 'zip'
      export_multi_format(data, entity_type, export_id)
    else
      raise "Unsupported format: #{format}"
    end
    
    # Upload file
    export_url = upload_to_storage(file_path, "exports/#{export_id}.#{format}", context)
    
    # Update export record
    context.state.set('exports', export_id, {
      'status' => 'completed',
      'url' => export_url,
      'recordCount' => data.length,
      'fileSize' => File.size(file_path),
      'completedAt' => DateTime.now.iso8601
    })
    
    # Clean up
    File.delete(file_path)
    
    # Emit completion
    context.emit(
      topic: 'export.completed',
      data: {
        exportId: export_id,
        url: export_url,
        recordCount: data.length
      }
    )
    
  rescue => e
    context.logger.error("Export failed: #{e.message}")
    context.state.set('exports', export_id, {
      'status' => 'failed',
      'error' => e.message
    })
    raise
  end
end

def fetch_entity_data(entity_type, filters, context)
  # Get all records of entity type
  all_records = context.state.get_group(entity_type) || []
  
  # Apply filters
  filtered = all_records
  
  filters.each do |field, value|
    if value.is_a?(Hash)
      # Range filter
      if value['min']
        filtered = filtered.select { |r| r[field] >= value['min'] }
      end
      if value['max']
        filtered = filtered.select { |r| r[field] <= value['max'] }
      end
    elsif value.is_a?(Array)
      # In filter
      filtered = filtered.select { |r| value.include?(r[field]) }
    else
      # Exact match
      filtered = filtered.select { |r| r[field] == value }
    end
  end
  
  filtered
end

def export_json(data, export_id)
  file_path = "/tmp/export_#{export_id}.json"
  
  File.open(file_path, 'w') do |file|
    file.write(JSON.pretty_generate({
      exportDate: DateTime.now.iso8601,
      recordCount: data.length,
      data: data
    }))
  end
  
  file_path
end

def export_sql(data, table_name, export_id)
  file_path = "/tmp/export_#{export_id}.sql"
  
  File.open(file_path, 'w') do |file|
    # Write header
    file.puts "-- Export generated at #{DateTime.now.iso8601}"
    file.puts "-- Table: #{table_name}"
    file.puts "-- Records: #{data.length}"
    file.puts
    
    # Create table statement
    if data.any?
      columns = data.first.keys
      file.puts "CREATE TABLE IF NOT EXISTS #{table_name} ("
      
      columns.each_with_index do |col, i|
        sample_value = data.map { |r| r[col] }.compact.first
        sql_type = case sample_value
        when Integer
          'INTEGER'
        when Float
          'DECIMAL(10,2)'
        when TrueClass, FalseClass
          'BOOLEAN'
        when Date, Time
          'TIMESTAMP'
        else
          'VARCHAR(255)'
        end
        
        file.puts "  #{col} #{sql_type}#{i < columns.length - 1 ? ',' : ''}"
      end
      
      file.puts ');'
      file.puts
      
      # Insert statements
      data.each do |record|
        values = columns.map do |col|
          value = record[col]
          case value
          when nil
            'NULL'
          when String
            "'#{value.gsub("'", "''")}'"
          when Date, Time
            "'#{value.iso8601}'"
          else
            value.to_s
          end
        end
        
        file.puts "INSERT INTO #{table_name} (#{columns.join(', ')}) VALUES (#{values.join(', ')});"
      end
    end
  end
  
  file_path
end

def export_multi_format(data, entity_type, export_id)
  zip_path = "/tmp/export_#{export_id}.zip"
  
  # Create individual export files
  json_path = export_json(data, "#{export_id}_json")
  csv_path = export_csv(data, "#{export_id}_csv")
  sql_path = export_sql(data, entity_type, "#{export_id}_sql")
  
  # Create zip file
  Zip::File.open(zip_path, Zip::File::CREATE) do |zipfile|
    zipfile.add("data.json", json_path)
    zipfile.add("data.csv", csv_path)
    zipfile.add("data.sql", sql_path)
    
    # Add README
    readme_content = <<~README
      Data Export - #{entity_type}
      Generated: #{DateTime.now.iso8601}
      Total Records: #{data.length}
      
      Files included:
      - data.json: Complete data in JSON format
      - data.csv: Tabular data for spreadsheet applications
      - data.sql: SQL statements for database import
      
      For questions, contact support@example.com
    README
    
    zipfile.get_output_stream("README.txt") { |f| f.write(readme_content) }
  end
  
  # Clean up individual files
  [json_path, csv_path, sql_path].each { |f| File.delete(f) }
  
  zip_path
end
```