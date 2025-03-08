import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'


const bootstrap = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  await app.listen(process.env.PORT ?? 3000)
  
  console.log(`\nApp listening on: http://127.0.0.1:3000`)
}

bootstrap().catch(console.error)
