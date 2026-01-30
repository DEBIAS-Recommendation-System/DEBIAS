import clearCart from "@/actions/Cart/clearCart";
import createOrder from "@/actions/Order/createOrder";
import { useToast } from "@/hooks/useToast";
import useTranslation from "@/translation/useTranslation";
import { PaymentMethodEnum } from "@/types/database.tables.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import useCart from "../cart/useCart";
import { sendMail } from "@/api/sendEmail";
import { sendBatchEvents } from "@/actions/events/sendEvent";
import { getSessionId } from "@/utils/session";

export default function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cart } = useCart();
  const { data: translation } = useTranslation();

  return useMutation({
    mutationFn: async (args: {
      first_name: string;
      last_name: string;
      address: string;
      region: string;
      city: string;
      phone_number: string;
      additional_info: string;
      payment_method: PaymentMethodEnum;
    }) => {
      const schema = z.object({
        first_name: z
          .string({
            message: translation?.lang["{ELEMENT} is required"].replace(
              "{ELEMENT}",
              "First name",
            ),
          })
          .min(2, {
            message: translation?.lang[
              "{ELEMENT} must be at least {MIN} characters"
            ]
              .replace("{ELEMENT}", "First name")
              .replace("{MIN}", "2"),
          }),
        last_name: z
          .string({
            message: translation?.lang["{ELEMENT} is required"].replace(
              "{ELEMENT}",
              "Last name",
            ),
          })
          .min(2, {
            message: translation?.lang[
              "{ELEMENT} must be at least {MIN} characters"
            ]
              .replace("{ELEMENT}", "Last name")
              .replace("{MIN}", "2"),
          }),
        address: z
          .string({
            message: translation?.lang["{ELEMENT} is required"].replace(
              "{ELEMENT}",
              "Address",
            ),
          })
          .min(4, {
            message: translation?.lang[
              "{ELEMENT} must be at least {MIN} characters"
            ]
              .replace("{ELEMENT}", "Address")
              .replace("{MIN}", "4"),
          }),
        region: z.string({
          message: translation?.lang["{ELEMENT} is required"].replace(
            "{ELEMENT}",
            "Region",
          ),
        }),
        city: z.string({
          message: translation?.lang["{ELEMENT} is required"].replace(
            "{ELEMENT}",
            "City",
          ),
        }),
        phone_number: z
          .string({
            message: translation?.lang["{ELEMENT} is required"].replace(
              "{ELEMENT}",
              "Phone number",
            ),
          })
          .regex(
            /^\+?[1-9]\d{1,14}$/,
            translation?.lang["Invalid {ELEMENT} format"].replace(
              "{ELEMENT}",
              "phone number",
            ),
          ),

        additional_info: z
          .string({
            message: translation?.lang["{ELEMENT} must be a string"].replace(
              "{ELEMENT}",
              "Additional info",
            ),
          })
          .optional(),
        payment_method: z.enum(
          [PaymentMethodEnum.CASH, PaymentMethodEnum.ONLINE],
          {
            message: translation?.lang["Choose a {ELEMENT}"].replace(
              "{ELEMENT}",
              "payment method",
            ),
          },
        ),
      });

      try {
        schema.parse(args);
      } catch (err) {
        if (err instanceof z.ZodError) {
          err.errors.map((error) => {
            throw new Error(error.message);
          });
        }
      }

      const { user_id, error: createOrderError } = await createOrder({
        order: args,
        cart: cart.data,
      });

      if (createOrderError) throw new Error(createOrderError);
      if (!user_id)
        throw new Error(translation?.lang["Failed to submit order"]);
      const emailTemplate = (isAdmin = false, args: any, cart: any) => {
        const subtotal =
          cart.data?.reduce(
            (acc: number, item: any) => acc + item.price * item.quantity,
            0,
          ) || 0;
        const deliveryCost = subtotal < 100 ? 8 : 0;
        const total = subtotal + deliveryCost;
      
        return `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${isAdmin ? "Nouvelle Commande Reçue" : "Confirmation de Commande"}</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; background-color: #f6f9fc; margin: 0; padding: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 20px; text-align: center; background-color: #4CAF50; background-image: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">${isAdmin ? "Nouvelle Commande Reçue" : "Confirmation de Commande"}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 20px;">
                  <p style="font-size: 18px; color: #333333; margin-bottom: 20px; text-align: center;">
                    ${
                      isAdmin
                        ? `Une nouvelle commande a été passée par ${args.first_name} ${args.last_name}.`
                        : `Merci pour votre commande, ${args.first_name} ${args.last_name} !`
                    }
                  </p>
                  ${
                    isAdmin
                      ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                        <tr>
                          <td colspan="2" style="padding: 15px; background-color: #f8f8f8; font-weight: bold; font-size: 20px; color: #333333; text-align: center;">
                            Informations du Client
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold;">Téléphone :</td>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0;">${args.phone_number}</td>
                        </tr>
                        <tr>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold;">Email :</td>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0;">${args.address}</td>
                        </tr>
                        <tr>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold;">Région :</td>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0;">${args.region}</td>
                        </tr>
                        <tr>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold;">Ville :</td>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0;">${args.city}</td>
                        </tr>
                        <tr>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold;">Informations supplémentaires :</td>
                          <td style="padding: 15px; border-top: 1px solid #e0e0e0;">${args.additional_info || 'Non spécifié'}</td>
                        </tr>
                      </table>
                      `
                      : ""
                  }
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                    <tr>
                      <td colspan="4" style="padding: 15px; background-color: #f8f8f8; font-weight: bold; font-size: 20px; color: #333333; text-align: center;">
                        Détails de la Commande
                      </td>
                    </tr>
                    ${cart.data
                      ?.map(
                        (item: any) => `
                      <tr>
                        <td style="padding: 15px; border-top: 1px solid #e0e0e0; width: 80px;">
                          <img src="${item?.image_url}" alt="${item?.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; display: block;">
                        </td>
                        <td style="padding: 15px; border-top: 1px solid #e0e0e0;">
                          <span style="font-weight: bold; color: #4CAF50; font-size: 16px;">${item?.title}</span>
                        </td>
                        <td style="padding: 15px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 16px;">
                          ${item.quantity}x
                        </td>
                        <td style="padding: 15px; border-top: 1px solid #e0e0e0; text-align: right; font-size: 16px;">
                          ${(item.price * item.quantity).toFixed(2)} dt
                        </td>
                      </tr>
                    `,
                      )
                      .join("")}
                    <tr>
                      <td colspan="3" style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold; text-align: right; font-size: 16px;">
                        Sous-total :
                      </td>
                      <td style="padding: 15px; border-top: 1px solid #e0e0e0; text-align: right; font-size: 16px;">
                        ${subtotal.toFixed(2)} dt
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3" style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold; text-align: right; font-size: 16px;">
                        Frais de Livraison :
                      </td>
                      <td style="padding: 15px; border-top: 1px solid #e0e0e0; text-align: right; font-size: 16px;">
                        ${deliveryCost.toFixed(2)} dt
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3" style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold; text-align: right; font-size: 18px;">
                        Total :
                      </td>
                      <td style="padding: 15px; border-top: 1px solid #e0e0e0; font-weight: bold; text-align: right; font-size: 18px; color: #4CAF50;">
                        ${total.toFixed(2)} dt
                      </td>
                    </tr>
                  </table>
                  ${
                    deliveryCost > 0
                      ? `<p style="font-size: 16px; color: #666666; margin-top: 20px; text-align: center;">
                          Des frais de livraison de 8 dt ont été ajoutés, car le total de la commande est inférieur à 100 dt.
                         </p>`
                      : ""
                  }
                  <p style="font-size: 18px; color: #333333; margin-top: 30px; text-align: center; font-style: italic;">
                    Nous apprécions votre confiance !
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px; text-align: center; background-color: #f8f8f8; color: #666666; font-size: 14px;">
                  &copy; ${new Date().getFullYear()} Safari Kids Shop. Tous droits réservés.
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
      };

      // Get the first product ID for complementary recommendations
      const firstProductId = cart.data?.[0]?.id;
      
      // Send purchase events to Neo4j for all cart items
      const sessionId = getSessionId();
      if (cart?.data && Array.isArray(cart.data)) {
        const purchaseEvents = cart.data.map((item: any) => ({
          event_type: "purchase" as const,
          product_id: parseInt(item.id),
          user_session: sessionId,
        }));
        
        try {
          await sendBatchEvents(purchaseEvents);
          console.log("✅ Purchase events sent for", purchaseEvents.length, "items");
        } catch (error) {
          console.error("Failed to send purchase events:", error);
          // Don't fail the order if event tracking fails
        }
      }
      
      try {
        await sendMail({
          to: args.address,
          subject: "Order Confirmation - Safari Kids Shop",
          text: "Your order has been placed successfully!",
          html: emailTemplate(false, args, cart),
        });

        await sendMail({
          to: process.env.USER_MAIL ?? "abirsn93@gmail.com",
          subject: "New Order Received - Safari Kids Shop",
          text: "A new order has been placed.",
          html: emailTemplate(true, args, cart),
        });
      } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send confirmation email");
      }

      const { error } = await clearCart(user_id);
      if (error) throw new Error(error);
      localStorage.clear();

      // Return the first product ID for redirecting to complementary products page
      return { firstProductId };
    },
    onSuccess: async (result) => {
      toast.success(
        translation?.lang["Order created successfully"] ??
          "Order created successfully",
      );
      await queryClient.invalidateQueries({
        queryKey: ["cart"],
      });

      // Redirect to complementary products page
      if (result?.firstProductId) {
        window.location.href = `/order-complete?product_id=${result.firstProductId}`;
      } else {
        window.location.href = "/order-complete";
      }
    },
    onError: (error) => {
      if (!error.message.includes("{")) {
        toast.error(error.message, "error");
      } else {
        const parsedError = JSON.parse(error.message);
        parsedError.forEach((err: any) => {
          toast.error(err.message);
        });
      }
    },
  });
}
