import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'


const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)
  await app.listen(3080)
  
  console.log(`\nApp listening on: http://127.0.0.1:3080`)
}

bootstrap().catch(console.error)
