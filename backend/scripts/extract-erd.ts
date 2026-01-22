import dataSource from '../database/datasource';

async function extractERD() {
  await dataSource.initialize();
  const entities = dataSource.entityMetadatas;
  
  console.log('=== DATABASE ERD SUMMARY ===\n');
  
  // 1. Extract each entity individually
  console.log('=== INDIVIDUAL ENTITIES ===');
  entities.forEach((entity, index) => {
    console.log(`\nENTITY ${index + 1}: ${entity.name}`);
    console.log(`Table: ${entity.tableName}`);
    console.log('Columns:');
    
    entity.columns.forEach(column => {
      const type = column.type;
      const isPrimary = column.isPrimary ? 'PRIMARY KEY' : '';
      const isNullable = column.isNullable ? 'NULL' : 'NOT NULL';
      console.log(`  - ${column.propertyName}: ${type} ${isPrimary} ${isNullable}`.trim());
    });
    
    console.log('Relationships:');
    entity.relations.forEach(relation => {
      const relationType = relation.relationType;
      const targetEntity = relation.inverseEntityMetadata?.name || 'Unknown';
      console.log(`  - ${relation.propertyName}: ${relationType} → ${targetEntity}`);
    });
  });
  
  // 2. Extract the whole system relationships
  console.log('\n\n=== WHOLE SYSTEM RELATIONSHIPS ===');
  entities.forEach(entity => {
    entity.relations.forEach(relation => {
      const relationType = relation.relationType;
      const targetEntity = relation.inverseEntityMetadata?.name || 'Unknown';
      
      let relationSymbol = '→';
      if (relationType === 'one-to-one') relationSymbol = '↔';
      if (relationType === 'one-to-many') relationSymbol = '→ (1:N)';
      if (relationType === 'many-to-one') relationSymbol = '← (N:1)';
      if (relationType === 'many-to-many') relationSymbol = '↔ (N:N)';
      
      console.log(`${entity.name} ${relationSymbol} ${targetEntity} [via: ${relation.propertyName}]`);
    });
  });
  
  // 3. Summary statistics
  console.log('\n\n=== SYSTEM SUMMARY ===');
  console.log(`Total Entities: ${entities.length}`);
  console.log(`Total Relationships: ${entities.reduce((acc, e) => acc + e.relations.length, 0)}`);
  
  // List all entity names for quick reference
  console.log('\nEntity List:');
  entities.forEach((entity, index) => {
    console.log(`${index + 1}. ${entity.name} (${entity.tableName}) - ${entity.columns.length} columns, ${entity.relations.length} relations`);
  });
}

extractERD().catch(console.error);